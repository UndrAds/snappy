;(function () {
  // Global tracking of active floaters to prevent duplicates
  var activeFloaters = {}
  var processedEmbeds = new Set()
  var pendingRequests = new Set()
  var initTimeout = null
  var lastRequestTime = 0
  var REQUEST_THROTTLE = 1000 // Minimum 1 second between requests
  var storyDataCache = new Map() // Cache for story data to prevent duplicate API calls

  // Wait for DOM to be ready
  function initializeEmbeds() {
    // Clear any pending initialization
    if (initTimeout) {
      clearTimeout(initTimeout)
    }

    initTimeout = setTimeout(function () {
      // Find all <ins> tags with snappy-webstory IDs
      var embedElements = document.querySelectorAll(
        'ins[id^="snappy-webstory-"]'
      )

      embedElements.forEach(function (element) {
        var embedId = element.id

        // Skip if already processed
        if (processedEmbeds.has(embedId)) {
          return
        }

        processedEmbeds.add(embedId)

        var storyId = element.getAttribute('data-story-id')
        var isFloater = element.getAttribute('data-floater') === 'true'

        if (!storyId) {
          console.warn('No data-story-id found for element:', element)
          return
        }

        if (isFloater) {
          processFloaterEmbed(element)
        } else {
          processRegularEmbed(element)
        }
      })
    }, 100) // Debounce initialization by 100ms
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEmbeds)
  } else {
    initializeEmbeds()
  }

  // Also run on window load to catch dynamically added elements
  window.addEventListener('load', function () {
    // Re-scan for any new elements that might have been added
    setTimeout(initializeEmbeds, 100)
  })

  // Watch for dynamically added elements
  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      var shouldReinitialize = false
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              // Element node
              if (
                (node.id && node.id.startsWith('snappy-webstory-')) ||
                (node.querySelector &&
                  node.querySelector('ins[id^="snappy-webstory-"]'))
              ) {
                shouldReinitialize = true
              }
            }
          })
        }
      })
      if (shouldReinitialize) {
        initializeEmbeds()
      }
    })

    // Only observe when document.body exists
    function startObserver() {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        })
      } else {
        setTimeout(startObserver, 100)
      }
    }
    startObserver()
  }

  function processRegularEmbed(element) {
    var storyId = element.getAttribute('data-story-id')
    var autoplay = element.getAttribute('data-autoplay') === 'true'
    var loop = element.getAttribute('data-loop') === 'true'
    var apiBaseUrl = element.getAttribute('data-api-url') || ''

    if (!storyId) return

    // Get dimensions from data attributes first, then element style, then defaults
    var width = element.getAttribute('data-width')
    var height = element.getAttribute('data-height')

    if (width) {
      width = parseInt(width)
    } else {
      width = element.style.width || element.offsetWidth
    }

    if (height) {
      height = parseInt(height)
    } else {
      height = element.style.height || element.offsetHeight
    }

    // If no dimensions specified, use default mobile story dimensions
    if (!width || width === 0) {
      width = 360
    }
    if (!height || height === 0) {
      height = 640
    }

    // Ensure dimensions are in pixels
    if (typeof width === 'string' && width.includes('px')) {
      width = parseInt(width)
    }
    if (typeof height === 'string' && height.includes('px')) {
      height = parseInt(height)
    }

    // Apply styling to the ins element to make it the direct container
    element.style.cssText = `
      display: block;
      width: ${width}px;
      height: ${height}px;
      margin: 20px auto;
      position: relative;
    `

    // Fetch and render story
    fetchAndRenderStory(
      storyId,
      apiBaseUrl,
      element,
      autoplay,
      false,
      null,
      loop
    )
  }

  function processFloaterEmbed(element) {
    var storyId = element.getAttribute('data-story-id')
    var direction = element.getAttribute('data-direction') || 'right'
    var triggerScroll = parseInt(
      element.getAttribute('data-trigger-scroll') || '50'
    )
    var position = element.getAttribute('data-position') || 'bottom'
    var size = element.getAttribute('data-size') || 'medium'
    var autoHide = element.getAttribute('data-auto-hide') === 'true'
    var autoHideDelay = parseInt(
      element.getAttribute('data-auto-hide-delay') || '5000'
    )
    var apiBaseUrl = element.getAttribute('data-api-url') || ''

    if (!storyId) return

    // Check if floater already exists and remove it
    var existingFloater = document.getElementById('snappy-floater-' + storyId)
    if (existingFloater) {
      existingFloater.remove()
    }

    // Check if we already have an active floater for this story
    if (activeFloaters[storyId]) {
      console.log('Floater already exists for story:', storyId)
      return
    }

    // Mark this floater as active
    activeFloaters[storyId] = true

    // Use the ins element itself as the regular container
    var regularContainer = element
    regularContainer.id = 'snappy-regular-' + storyId

    // Check if story data is already cached
    var storyData = storyDataCache.get(storyId)

    if (storyData) {
      // Use cached data
      console.log('Using cached story data for:', storyId)
      processFloaterWithData(
        storyData,
        element,
        apiBaseUrl,
        direction,
        triggerScroll,
        position,
        size,
        autoHide,
        autoHideDelay
      )
    } else {
      // Fetch the story data to get format and device frame
      fetch(apiBaseUrl + '/api/stories/public/' + storyId)
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Story not found - Status: ' + response.status)
          }
          return response.json()
        })
        .then(function (apiResponse) {
          if (!apiResponse.success || !apiResponse.data) {
            throw new Error('Invalid story data')
          }

          var storyData = apiResponse.data
          // Cache the story data
          storyDataCache.set(storyId, storyData)

          processFloaterWithData(
            storyData,
            element,
            apiBaseUrl,
            direction,
            triggerScroll,
            position,
            size,
            autoHide,
            autoHideDelay
          )
        })
        .catch(function (error) {
          console.error('Failed to load story for floater:', error)
        })
    }
  }

  function processFloaterWithData(
    storyData,
    element,
    apiBaseUrl,
    direction,
    triggerScroll,
    position,
    size,
    autoHide,
    autoHideDelay
  ) {
    var storyId = element.getAttribute('data-story-id')
    var storyFormat = storyData.format || 'portrait'
    var storyDeviceFrame = storyData.deviceFrame || 'mobile'

    // Calculate dimensions based on story's actual format and device frame
    var dimensions = calculateFloaterDimensions(
      storyFormat,
      storyDeviceFrame,
      size
    )

    // Use the ins element itself as the regular container
    var regularContainer = element
    regularContainer.id = 'snappy-regular-' + storyId

    // Style the regular container based on story format and device frame
    var regularDimensions = calculateRegularContainerDimensions(
      storyFormat,
      storyDeviceFrame
    )

    // Get dimensions from the element's style or use regular dimensions
    var width = element.style.width || element.offsetWidth
    var height = element.style.height || element.offsetHeight

    // If no dimensions specified, use regular container dimensions
    if (!width || width === 0) {
      width = regularDimensions.width
    }
    if (!height || height === 0) {
      height = regularDimensions.height
    }

    // Ensure dimensions are in pixels
    if (typeof width === 'string' && width.includes('px')) {
      width = parseInt(width)
    }
    if (typeof height === 'string' && height.includes('px')) {
      height = parseInt(height)
    }

    regularContainer.style.cssText = `
      display: block;
      width: ${width}px;
      height: ${height}px;
      margin: 20px auto;
      position: relative;
    `

    // Render the story in the regular container first (reuse the fetched data)
    renderStoryDirectly(storyData, regularContainer, false, false, null, false)

    // Create floater container with calculated dimensions
    var floaterContainer = document.createElement('div')
    floaterContainer.id = 'snappy-floater-' + storyId
    floaterContainer.style.cssText = `
      position: fixed;
      ${direction}: 20px;
      ${position}: 20px;
      z-index: 9999;
      display: none;
      transition: all 0.3s ease;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      border-radius: 12px;
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
    `

    // Create inner container for the story with scaling
    var storyContainer = document.createElement('div')
    storyContainer.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      transform-origin: top left;
      transform: scale(${dimensions.width / width});
    `

    // Always add close button for floater embeds
    var closeButton = document.createElement('button')
    closeButton.innerHTML = '×'
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border: none;
      background: rgba(0,0,0,0.8);
      color: white;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    `
    closeButton.onclick = function () {
      // Remove event listeners
      window.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)

      // Clear any pending timeouts
      if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
      }

      // Remove from active floaters tracking
      delete activeFloaters[storyId]

      // Remove only the floater from DOM completely
      if (floaterContainer && floaterContainer.parentNode) {
        floaterContainer.parentNode.removeChild(floaterContainer)
      }
      // Keep the regular container - don't remove it!
      // The regular embed should remain visible on the page
    }
    floaterContainer.appendChild(closeButton)
    floaterContainer.appendChild(storyContainer)

    // Add to page
    document.body.appendChild(floaterContainer)

    // Scroll detection
    var isVisible = false
    var hideTimeout = null

    function checkScroll() {
      var scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
        100

      if (scrollPercent >= triggerScroll && !isVisible) {
        showFloater()
      } else if (scrollPercent < triggerScroll && isVisible) {
        hideFloater()
      }
    }

    function showFloater() {
      if (isVisible) return

      isVisible = true
      floaterContainer.style.display = 'block'
      floaterContainer.style.opacity = '0'
      floaterContainer.style.transform = 'translateY(20px)'

      // Animate in
      setTimeout(function () {
        floaterContainer.style.opacity = '1'
        floaterContainer.style.transform = 'translateY(0)'
      }, 10)

      // Auto hide if enabled
      if (autoHide && autoHideDelay > 0) {
        if (hideTimeout) clearTimeout(hideTimeout)
        hideTimeout = setTimeout(hideFloater, autoHideDelay)
      }
    }

    function hideFloater() {
      if (!isVisible) return

      isVisible = false
      floaterContainer.style.opacity = '0'
      floaterContainer.style.transform = 'translateY(20px)'

      setTimeout(function () {
        floaterContainer.style.display = 'none'
      }, 300)

      if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
      }
    }

    // Render story into the story container with floater scaling (reuse the fetched data)
    renderStoryDirectly(
      storyData,
      storyContainer,
      false,
      true,
      {
        isFloater: true,
        scaleFactor: dimensions.width / width,
        floaterDimensions: dimensions,
      },
      false
    )

    // Start scroll detection
    window.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    // Initial check
    checkScroll()
  }

  function renderStoryDirectly(
    storyData,
    container,
    autoplay,
    isFloater,
    floaterOptions,
    loop
  ) {
    // Default loop to false if not provided
    if (loop === undefined) loop = false
    console.log('Rendering story directly with data:', storyData)

    var frames = storyData.frames || []
    // Escapers for safe inline HTML
    function escapeHtml(str) {
      if (str == null) return ''
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }
    function escapeAttr(str) {
      if (str == null) return ''
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }
    var story = {
      storyTitle: storyData.title,
      publisherName: storyData.publisherName,
      publisherPic: storyData.publisherPic,
      ctaType: storyData.ctaType,
      ctaValue: storyData.ctaValue,
      format: storyData.format || 'portrait',
      deviceFrame: storyData.deviceFrame || 'mobile',
      defaultDurationMs: storyData.defaultDurationMs || 2500,
    }

    console.log('Final story object:', story)
    console.log('Final format:', story.format)
    console.log('Final deviceFrame:', story.deviceFrame)

    // Get container dimensions
    var width = container.style.width || container.offsetWidth || 360
    var height = container.style.height || container.offsetHeight || 700

    // Ensure dimensions are in pixels
    if (typeof width === 'string' && width.includes('px')) {
      width = parseInt(width)
    }
    if (typeof height === 'string' && height.includes('px')) {
      height = parseInt(height)
    }

    // Calculate frame styling based on story's format and device frame
    var frameStyle = getFrameStyle(story.format, story.deviceFrame)
    console.log('Frame style calculated:', frameStyle)

    var iframe = document.createElement('iframe')

    // Handle floater scaling
    if (floaterOptions && floaterOptions.isFloater) {
      var scaleFactor = floaterOptions.scaleFactor || 1
      var floaterDims = floaterOptions.floaterDimensions
      iframe.style.width = floaterDims.width / scaleFactor + 'px'
      iframe.style.height = floaterDims.height / scaleFactor + 'px'
    } else {
      iframe.style.width = '100%'
      iframe.style.height = '100%'
    }

    iframe.style.border = frameStyle.border
    iframe.style.borderRadius = frameStyle.borderRadius
    iframe.style.background = frameStyle.background
    iframe.style.boxShadow = frameStyle.boxShadow
    iframe.style.display = 'block'
    iframe.style.margin = '0'
    iframe.style.position = 'absolute'
    iframe.style.top = '0'
    iframe.style.left = '0'
    iframe.style.outline = 'none'
    iframe.style.zIndex = '1'
    var slideDuration = 2500 // default; overridden per-frame in inline script

    // Helper function to calculate text element position and size based on format/deviceFrame
    function calculateTextElementPosition(
      el,
      containerWidth,
      containerHeight,
      format,
      deviceFrame,
      hasFrameLink
    ) {
      var isLandscapeVideoPlayer =
        format === 'landscape' && deviceFrame === 'video-player'
      var isPortraitMobile = format === 'portrait' && deviceFrame === 'mobile'

      // Text positioning - button will be positioned below text dynamically
      var textBottomPadding = 20 // Padding from bottom for text (button will be below with gap)

      var textWidth, textLeft, textBottom, textHeight

      if (isLandscapeVideoPlayer) {
        // Landscape video player: 50% width, centered, bottom with padding
        textWidth = Math.round(containerWidth * 0.5)
        textLeft = Math.round((containerWidth - textWidth) / 2)
        textBottom = textBottomPadding
        // Height stays dynamic based on content, but ensure minimum
        textHeight = el.height || Math.max(60, containerHeight * 0.15)
      } else if (isPortraitMobile) {
        // Portrait mobile: 90% width, centered, bottom with padding
        textWidth = Math.round(containerWidth * 0.9)
        textLeft = Math.round((containerWidth - textWidth) / 2)
        textBottom = textBottomPadding
        // Height stays dynamic based on content, but ensure minimum
        textHeight = el.height || Math.max(60, containerHeight * 0.15)
      } else {
        // Other formats (portrait video-player, landscape mobile): use similar logic as portrait mobile
        textWidth = Math.round(containerWidth * 0.85)
        textLeft = Math.round((containerWidth - textWidth) / 2)
        textBottom = textBottomPadding
        textHeight = el.height || Math.max(60, containerHeight * 0.15)
      }

      // Convert bottom to top position (since we use top in CSS)
      // Position from bottom, accounting for button space if needed
      var buttonSpace = hasFrameLink ? 80 : 0 // Space for button + gap
      var textTop = containerHeight - textBottom - textHeight - buttonSpace

      return {
        left: textLeft,
        top: Math.max(80, textTop), // Ensure text doesn't overlap with header (top:32px + 32px height + 16px padding)
        width: textWidth,
        height: textHeight,
      }
    }

    // Store button data for creating buttons outside slides
    var buttonData = []

    // Build the story UI (same as in fetchAndRenderStory)
    var slides = frames.map(function (frame, idx) {
      // Handle ad frames
      if (frame.type === 'ad' && frame.adConfig) {
        var progress =
          '<div style="position:absolute;left:16px;right:16px;top:16px;z-index:20;display:flex;gap:4px;">' +
          Array.from({ length: frames.length })
            .map(function (_, i) {
              return (
                '<div style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.3);overflow:hidden;"><div class="progress-bar" data-idx="' +
                i +
                '" style="height:100%;border-radius:2px;background:#fff;width:0%;transition:width 0.3s;"></div></div>'
              )
            })
            .join('') +
          '</div>'

        // Frame Link Button for ad frames - store data instead of creating HTML
        var adLinkClickHandler = ''
        if (frame.link) {
          // Calculate button size based on aspect ratio
          var isLandscape = story.format === 'landscape'
          var aspectRatio = width / height
          var isWide = aspectRatio > 1.2 // Wide aspect ratio (landscape video player)

          // Button size calculations based on aspect ratio
          var buttonPadding = isWide ? '8px 16px' : '12px 24px'
          var buttonFontSize = isWide ? '12px' : '15px'
          var buttonLeft = isWide ? '50%' : '16px'
          var buttonRight = isWide ? 'auto' : '16px'
          var buttonTransform = isWide ? 'translateX(-50%)' : 'none'
          var buttonMaxWidth = isWide ? '80%' : 'auto'
          var buttonTop = height - 80 + 'px' // Position from bottom (32px bottom + ~48px button height)

          // Use frame-specific link text or default
          var linkButtonText =
            frame.linkText && frame.linkText.trim()
              ? frame.linkText.trim()
              : 'Read More'

          // Store button data instead of creating HTML
          buttonData.push({
            idx: idx,
            link: frame.link,
            text: linkButtonText,
            left: buttonLeft,
            top: buttonTop,
            transform: buttonTransform,
            marginLeft: '0',
            maxWidth: buttonMaxWidth,
            padding: buttonPadding,
            fontSize: buttonFontSize,
          })

          // Remove parent slide click handler when button exists (navigation still works via nav areas)
          adLinkClickHandler = ''
        }

        return (
          '<div class="slide' +
          (frame.link ? ' has-link' : '') +
          '" ' +
          adLinkClickHandler +
          ' style="position:absolute;top:0;left:0;width:100%;height:100%;background:#000;border-radius:' +
          frameStyle.innerBorderRadius +
          ';overflow:hidden;">' +
          progress +
          '<div id="' +
          frame.adConfig.adId +
          '" class="ad-frame" style="width:100%;height:100%;"></div>' +
          '</div>'
        )
      }

      // Handle regular story frames
      var bg = ''
      var bgImg = ''
      if (frame.background) {
        if (frame.background.type === 'color') {
          bg = 'background:' + frame.background.value + ';'
        } else if (frame.background.type === 'image') {
          bg = 'background:#000;'
          bgImg =
            '<img src="' +
            frame.background.value +
            '" style="position:absolute;left:50%;top:50%;width:100%;height:100%;object-fit:cover;transform:translate(-50%,-50%);z-index:0;border-radius:' +
            frameStyle.innerBorderRadius +
            ';" />'
        }
      }
      // Track text element position for button placement
      var textElementBottom = null
      var textElementLeft = null
      var textElementWidth = null

      var elementsHtml = (frame.elements || [])
        .map(function (el) {
          var style = ''
          var elementWidth = el.width
          var elementHeight = el.height
          var elementLeft = el.x
          var elementTop = el.y

          // For text elements, calculate position based on format/deviceFrame
          if (el.type === 'text') {
            var textPos = calculateTextElementPosition(
              el,
              width,
              height,
              story.format,
              story.deviceFrame,
              !!frame.link
            )
            elementWidth = textPos.width
            elementHeight = textPos.height
            elementLeft = textPos.left
            elementTop = textPos.top

            // Store text element position for button placement
            // Since height is auto, estimate actual height (at least min-height)
            var estimatedHeight = Math.max(
              elementHeight,
              Math.max(24, Math.round(el.height || 0))
            )
            textElementBottom = elementTop + estimatedHeight
            textElementLeft = elementLeft
            textElementWidth = elementWidth
          }

          style =
            'position:absolute;left:' +
            elementLeft +
            'px;top:' +
            elementTop +
            'px;width:' +
            elementWidth +
            'px;height:' +
            elementHeight +
            'px;'
          if (el.type === 'text') {
            var minH = Math.max(24, Math.round(elementHeight || 0))
            style +=
              'color:' +
              (el.style.color || '#fff') +
              ';font-size:' +
              (el.style.fontSize || 18) +
              'px;font-family:' +
              (el.style.fontFamily || 'inherit') +
              ';font-weight:' +
              (el.style.fontWeight || 'normal') +
              ';background:' +
              (el.style.backgroundColor || 'transparent') +
              ';opacity:' +
              (el.style.opacity || 100) / 100 +
              ';display:flex;align-items:center;justify-content:center;text-align:center;padding:2px;' +
              'height:auto;min-height:' +
              minH +
              'px;z-index:5;word-break:break-word;overflow-wrap:break-word;'
            return (
              '<div style="' +
              style +
              '">' +
              escapeHtml(el.content || '') +
              '</div>'
            )
          }
          if (el.type === 'image') {
            return (
              '<img src="' +
              el.mediaUrl +
              '" style="' +
              style +
              'object-fit:cover;border-radius:8px;" />'
            )
          }
          return ''
        })
        .join('')

      // Publisher info/header
      var header = ''
      if (story.publisherName || story.storyTitle) {
        header =
          '<div style="position:absolute;left:16px;right:16px;top:32px;z-index:10;display:flex;align-items:center;gap:12px;">' +
          (story.publisherPic
            ? '<img src="' +
              story.publisherPic +
              '" style="height:32px;width:32px;border-radius:50%;border:2px solid #fff;object-fit:cover;" />'
            : '<div style="height:32px;width:32px;border-radius:50%;border:2px solid #fff;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">PP</div>') +
          '<div style="flex:1;"><div style="color:#fff;font-weight:600;font-size:15px;">' +
          escapeHtml(story.publisherName || '') +
          '</div><div style="color:#fff;opacity:0.8;font-size:12px;">' +
          escapeHtml(story.storyTitle || '') +
          '</div></div>' +
          '<div style="color:#fff;font-size:12px;">' +
          (idx + 1) +
          '/' +
          frames.length +
          '</div>' +
          '</div>'
      }

      // Frame Link Button - Replace CTA with frame-specific link button
      var frameLinkButton = ''
      var linkClickHandler = ''
      if (frame.link) {
        // Calculate button size based on aspect ratio
        var isLandscape = story.format === 'landscape'
        var aspectRatio = width / height
        var isWide = aspectRatio > 1.2 // Wide aspect ratio (landscape video player)

        // Button size calculations based on aspect ratio
        var buttonPadding = isWide ? '8px 16px' : '12px 24px'
        var buttonFontSize = isWide ? '12px' : '15px'
        var buttonMaxWidth = isWide ? '80%' : 'auto'

        // Position button below text element with gap
        var buttonGap = 24 // Gap between text and button
        var buttonTop =
          textElementBottom !== null
            ? textElementBottom + buttonGap
            : height - 100 // Fallback if no text element

        // Calculate button horizontal position based on text element or aspect ratio
        var buttonLeft = ''
        var buttonTransform = ''
        var buttonMarginLeft = ''

        if (textElementLeft !== null && textElementWidth !== null) {
          // Center button relative to text element
          var buttonWidth = isWide
            ? Math.min(textElementWidth, width * 0.8)
            : Math.min(textElementWidth, width - 32)
          buttonLeft = textElementLeft + textElementWidth / 2 + 'px'
          buttonTransform = 'translateX(-50%)'
          buttonMarginLeft = '0'
        } else {
          // Fallback: center based on aspect ratio
          buttonLeft = isWide ? '50%' : '16px'
          buttonTransform = isWide ? 'translateX(-50%)' : 'none'
          buttonMarginLeft = isWide ? '0' : '0'
        }

        // Use frame-specific link text or default
        var linkButtonText =
          frame.linkText && frame.linkText.trim()
            ? frame.linkText.trim()
            : 'Read More'

        // Create clickable link button with proper event handling
        frameLinkButton =
          '<a href="' +
          escapeAttr(frame.link) +
          '" target="_blank" rel="noopener noreferrer" id="snappy-frame-link-btn-' +
          idx +
          '" onclick="event.stopPropagation();" style="position:absolute;left:' +
          buttonLeft +
          ';margin-left:' +
          buttonMarginLeft +
          ';top:' +
          buttonTop +
          'px;z-index:20;display:block;text-decoration:none;transform:' +
          buttonTransform +
          ';max-width:' +
          buttonMaxWidth +
          ';pointer-events:auto;"><div style="border-radius:999px;background:rgba(255,255,255,0.9);padding:' +
          buttonPadding +
          ';text-align:center;backdrop-filter:blur(4px);font-weight:600;color:#111;font-size:' +
          buttonFontSize +
          ';cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(0,0,0,0.15);pointer-events:none;">' +
          escapeHtml(linkButtonText) +
          '</div></a>'

        // Remove parent slide click handler when button exists (navigation still works via nav areas)
        linkClickHandler = ''
      } else if (story.ctaType) {
        // Fallback to story-level CTA if no frame link
        var ctaText = ''
        if (story.ctaType === 'redirect') ctaText = 'Visit Link'
        if (story.ctaType === 'form') ctaText = 'Fill Form'
        if (story.ctaType === 'promo') ctaText = 'Get Promo'
        if (story.ctaType === 'sell') ctaText = 'Buy Now'
        frameLinkButton =
          '<div id="snappy-cta-btn" style="position:absolute;left:16px;right:16px;bottom:32px;z-index:10;"><div style="border-radius:999px;background:rgba(255,255,255,0.9);padding:12px 24px;text-align:center;backdrop-filter:blur(4px);font-weight:600;color:#111;font-size:15px;cursor:pointer;">' +
          ctaText +
          '</div></div>'
      }

      // Progress bar
      var progress =
        '<div style="position:absolute;left:16px;right:16px;top:16px;z-index:20;display:flex;gap:4px;">' +
        Array.from({ length: frames.length })
          .map(function (_, i) {
            return (
              '<div style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.3);overflow:hidden;"><div class="progress-bar" data-idx="' +
              i +
              '" style="height:100%;border-radius:2px;background:#fff;width:0%;transition:width 0.3s;"></div></div>'
            )
          })
          .join('') +
        '</div>'

      return (
        '<div class="slide' +
        (frame.link ? ' has-link' : '') +
        '" ' +
        linkClickHandler +
        ' style="position:absolute;top:0;left:0;width:100%;height:100%;' +
        bg +
        'border-radius:' +
        frameStyle.innerBorderRadius +
        ';overflow:hidden;">' +
        progress +
        header +
        bgImg +
        '<div style="position:relative;width:100%;height:100%;z-index:10;">' +
        elementsHtml +
        '</div>' +
        '</div>'
      )
    })

    // Create buttons container outside slides
    var buttonsHtml = buttonData
      .map(function (btn) {
        return (
          '<a href="' +
          escapeAttr(btn.link) +
          '" target="_blank" rel="noopener noreferrer" class="snappy-frame-link-btn" data-frame-idx="' +
          btn.idx +
          '" onclick="event.stopPropagation(); event.preventDefault(); window.open(\'' +
          escapeAttr(btn.link) +
          "', '_blank', 'noopener,noreferrer');\" style=\"position:absolute;left:" +
          btn.left +
          ';margin-left:' +
          btn.marginLeft +
          ';top:' +
          btn.top +
          'px;z-index:70;display:none;text-decoration:none;transform:' +
          btn.transform +
          ';max-width:' +
          btn.maxWidth +
          ';pointer-events:auto;cursor:pointer;\"><div style="border-radius:999px;background:rgba(255,255,255,0.9);padding:' +
          btn.padding +
          ';text-align:center;backdrop-filter:blur(4px);font-weight:600;color:#111;font-size:' +
          btn.fontSize +
          ';cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(0,0,0,0.15);pointer-events:none;">' +
          escapeHtml(btn.text) +
          '</div></a>'
        )
      })
      .join('')

    var html =
      `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
      html,body{margin:0;padding:0;overflow:hidden;background:#111;width:100vw;height:100vh;}
      body{width:100vw;height:100vh;}
      .slide{transition:opacity 0.3s;opacity:0;pointer-events:none;width:100%;height:100%;position:absolute;top:0;left:0;}
      .slide.active{opacity:1;pointer-events:auto;z-index:1;}
      .slide.has-link.active{pointer-events:auto;cursor:pointer;z-index:2;}
      .nav-btn{display:none;}
      .nav-area{position:absolute;top:0;bottom:0;width:50%;z-index:50;}
      .nav-area.left{left:0;}
      .nav-area.right{right:0;}
      #snappy-cta-btn > div { cursor: pointer; }
      .snappy-frame-link-btn { cursor: pointer !important; pointer-events: auto !important; z-index: 70 !important; }
      .snappy-frame-link-btn > div { cursor: pointer; pointer-events: none; }
      .snappy-frame-link-btn > div:hover { background: rgba(255,255,255,1); transform: scale(1.05); }
      .ad-frame { background: #000; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
    </style><script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script></head><body><div style="width:100vw;height:100vh;position:relative;margin:0 auto;background:#111;border-radius:` +
      frameStyle.innerBorderRadius +
      `;overflow:hidden;">
    ${slides.join('')}
    ${buttonsHtml}
    <div class="nav-area left" id="navLeft"></div><div class="nav-area right" id="navRight"></div>
    </div><script>
    // Initialize Google Publisher Tag
    window.googletag = window.googletag || {cmd: []};
    
    // Initialize ads for ad frames
    function initializeAds() {
      if (window.googletag && window.googletag.defineSlot) {
        // Enable services once
        window.googletag.pubads().enableSingleRequest();
        window.googletag.pubads().enableAsyncRendering();
        window.googletag.enableServices();
        
        // Create a map to track created slots
        var createdSlots = new Set();
        
        frames.forEach(function(frame) {
          if (frame.type === 'ad' && frame.adConfig) {
            var adId = frame.adConfig.adId;
            
            // Skip if we already created this slot
            if (createdSlots.has(adId)) {
              return;
            }
            
            try {
              // Check if slot already exists in GPT
              var existingSlots = window.googletag.pubads().getSlots();
              var slotExists = existingSlots.some(function(slot) {
                try {
                  return slot.getSlotElementId() === adId;
                } catch (e) {
                  return false;
                }
              });
              
              if (!slotExists) {
                var slot = window.googletag.defineSlot(frame.adConfig.adUnitPath, [300, 250], adId);
                if (slot) {
                  slot.addService(window.googletag.pubads());
                  window.googletag.display(adId);
                  createdSlots.add(adId);
                  console.log('Created ad slot:', adId);
                }
              } else {
                console.log('Slot already exists:', adId);
              }
            } catch (error) {
              console.error('Error creating slot for', adId, ':', error);
            }
          }
        });
      }
    }
    
    // Wait for GPT to load
    if (window.googletag && window.googletag.defineSlot) {
      initializeAds();
    } else {
      window.googletag.cmd.push(initializeAds);
    }
    
    var slides=document.querySelectorAll('.slide');var idx=0;var timer=null;var story=${JSON.stringify(story)};var frames=${JSON.stringify(frames)};var loop=${loop};var frameDurations=(frames||[]).map(function(f){return (f&&f.durationMs)?f.durationMs:(story.defaultDurationMs||2500);});function animateProgressBar(i){var bars=document.querySelectorAll('.progress-bar');var dur=frameDurations[i]||story.defaultDurationMs||2500;bars.forEach(function(bar,bidx){bar.style.transition='none';if(bidx<i){bar.style.width='100%';bar.style.transition='width 0.3s';}else if(bidx===i){bar.style.width='0%';setTimeout(function(){bar.style.transition='width '+dur+'ms linear';bar.style.width='100%';},0);}else{bar.style.width='0%';}});}function show(i){slides.forEach(function(s,j){s.classList.toggle('active',j===i);});var buttons=document.querySelectorAll('.snappy-frame-link-btn');buttons.forEach(function(btn){var btnIdx=parseInt(btn.getAttribute('data-frame-idx')||'-1');btn.style.display=btnIdx===i?'block':'none';});animateProgressBar(i);attachCTAHandler();}function next(){if(loop){idx=(idx+1)%slides.length;}else{if(idx<slides.length-1){idx++;}}show(idx);if(${autoplay}){scheduleNext();}}function prev(){if(loop){idx=(idx-1+slides.length)%slides.length;}else{if(idx>0){idx--;}}show(idx);if(${autoplay}){scheduleNext();}}document.getElementById('navLeft').onclick=prev;document.getElementById('navRight').onclick=next;function scheduleNext(){if(timer){clearTimeout(timer);}var dur=frameDurations[idx]||story.defaultDurationMs||2500;timer=setTimeout(function(){if(loop){idx=(idx+1)%slides.length;}else{if(idx<slides.length-1){idx++;}else{return;}}show(idx);scheduleNext();},dur);}function attachCTAHandler(){var cta=document.getElementById('snappy-cta-btn');if(cta){cta.onclick=function(e){e.stopPropagation();if(story.ctaType==='redirect'&&story.ctaValue){window.open(story.ctaValue,'_blank');}else{alert('CTA clicked: '+(story.ctaType||''));}};}}function handleFrameLink(url){try{if(url){window.open(url,'_blank','noopener,noreferrer');}}catch(e){}}show(idx);if(${autoplay}){scheduleNext();}
    </script></body></html>`

    iframe.srcdoc = html

    // Clear container and append iframe directly
    container.innerHTML = ''
    container.appendChild(iframe)
  }

  function fetchAndRenderStory(
    storyId,
    apiBaseUrl,
    container,
    autoplay,
    isFloater,
    floaterOptions,
    loop
  ) {
    // Default loop to false if not provided
    if (loop === undefined) loop = false
    // Prevent duplicate requests for the same story
    var requestKey = storyId + '-' + (isFloater ? 'floater' : 'regular')
    if (pendingRequests.has(requestKey)) {
      console.log('Request already pending for story:', storyId)
      return
    }

    pendingRequests.add(requestKey)

    // Throttle requests to prevent rate limiting
    var now = Date.now()
    var timeSinceLastRequest = now - lastRequestTime
    var delay = Math.max(0, REQUEST_THROTTLE - timeSinceLastRequest)

    setTimeout(function () {
      lastRequestTime = Date.now()

      console.log(
        'Fetching story from:',
        apiBaseUrl + '/api/stories/public/' + storyId
      )
      fetch(apiBaseUrl + '/api/stories/public/' + storyId)
        .then(function (response) {
          console.log('Response status:', response.status)
          if (!response.ok) {
            throw new Error('Story not found - Status: ' + response.status)
          }
          return response.json()
        })
        .then(function (apiResponse) {
          console.log('API Response:', apiResponse)
          if (!apiResponse.success || !apiResponse.data) {
            throw new Error('Invalid story data')
          }

          var storyData = apiResponse.data
          console.log('Story Data:', storyData)
          console.log('Format from API:', storyData.format)
          console.log('Device Frame from API:', storyData.deviceFrame)

          // Cache the story data to prevent duplicate API calls
          storyDataCache.set(storyId, storyData)

          var frames = storyData.frames || []
          var story = {
            storyTitle: storyData.title,
            publisherName: storyData.publisherName,
            publisherPic: storyData.publisherPic,
            ctaType: storyData.ctaType,
            ctaValue: storyData.ctaValue,
            format: storyData.format || 'portrait',
            deviceFrame: storyData.deviceFrame || 'mobile',
          }

          console.log('Final story object:', story)
          console.log('Final format:', story.format)
          console.log('Final deviceFrame:', story.deviceFrame)

          // Determine ideal container dimensions from story format/device frame
          var idealDims = calculateRegularContainerDimensions(
            story.format,
            story.deviceFrame
          )

          // If container has no explicit size or is using defaults, set appropriate size
          var currentWidth = container.style.width || container.offsetWidth
          var currentHeight = container.style.height || container.offsetHeight
          if (!currentWidth || !currentHeight) {
            container.style.width = idealDims.width + 'px'
            container.style.height = idealDims.height + 'px'
          } else {
            // If it's still at portrait defaults (360x640), switch to ideal
            var cw =
              typeof currentWidth === 'string' && currentWidth.includes('px')
                ? parseInt(currentWidth)
                : currentWidth
            var ch =
              typeof currentHeight === 'string' && currentHeight.includes('px')
                ? parseInt(currentHeight)
                : currentHeight
            if ((cw === 360 && ch === 640) || cw === 0 || ch === 0) {
              container.style.width = idealDims.width + 'px'
              container.style.height = idealDims.height + 'px'
            }
          }

          // Get container dimensions (after possible adjustment)
          var width =
            container.style.width || container.offsetWidth || idealDims.width
          var height =
            container.style.height || container.offsetHeight || idealDims.height

          // Ensure dimensions are in pixels
          if (typeof width === 'string' && width.includes('px')) {
            width = parseInt(width)
          }
          if (typeof height === 'string' && height.includes('px')) {
            height = parseInt(height)
          }

          // Calculate frame styling based on story's format and device frame
          var frameStyle = getFrameStyle(story.format, story.deviceFrame)
          console.log('Frame style calculated:', frameStyle)

          var iframe = document.createElement('iframe')

          // Handle floater scaling
          if (floaterOptions && floaterOptions.isFloater) {
            var scaleFactor = floaterOptions.scaleFactor || 1
            var floaterDims = floaterOptions.floaterDimensions
            iframe.style.width = floaterDims.width / scaleFactor + 'px'
            iframe.style.height = floaterDims.height / scaleFactor + 'px'
          } else {
            iframe.style.width = '100%'
            iframe.style.height = '100%'
          }

          iframe.style.border = frameStyle.border
          iframe.style.borderRadius = frameStyle.borderRadius
          iframe.style.background = frameStyle.background
          iframe.style.boxShadow = frameStyle.boxShadow
          iframe.style.display = 'block'
          iframe.style.margin = '0'
          iframe.style.position = 'absolute'
          iframe.style.top = '0'
          iframe.style.left = '0'
          iframe.style.outline = 'none'
          iframe.style.zIndex = '1'
          var slideDuration = 2500 // default; overridden per-frame in inline script

          // Helper function to calculate text element position and size based on format/deviceFrame
          function calculateTextElementPosition(
            el,
            containerWidth,
            containerHeight,
            format,
            deviceFrame,
            hasFrameLink
          ) {
            var isLandscapeVideoPlayer =
              format === 'landscape' && deviceFrame === 'video-player'
            var isPortraitMobile =
              format === 'portrait' && deviceFrame === 'mobile'

            // Text positioning - button will be positioned below text dynamically
            var textBottomPadding = 20 // Padding from bottom for text (button will be below with gap)

            var textWidth, textLeft, textBottom, textHeight

            if (isLandscapeVideoPlayer) {
              // Landscape video player: 50% width, centered, bottom with padding
              textWidth = Math.round(containerWidth * 0.5)
              textLeft = Math.round((containerWidth - textWidth) / 2)
              textBottom = textBottomPadding
              // Height stays dynamic based on content, but ensure minimum
              textHeight = el.height || Math.max(60, containerHeight * 0.15)
            } else if (isPortraitMobile) {
              // Portrait mobile: 90% width, centered, bottom with padding
              textWidth = Math.round(containerWidth * 0.9)
              textLeft = Math.round((containerWidth - textWidth) / 2)
              textBottom = textBottomPadding
              // Height stays dynamic based on content, but ensure minimum
              textHeight = el.height || Math.max(60, containerHeight * 0.15)
            } else {
              // Other formats (portrait video-player, landscape mobile): use similar logic as portrait mobile
              textWidth = Math.round(containerWidth * 0.85)
              textLeft = Math.round((containerWidth - textWidth) / 2)
              textBottom = textBottomPadding
              textHeight = el.height || Math.max(60, containerHeight * 0.15)
            }

            // Convert bottom to top position (since we use top in CSS)
            // Position from bottom, accounting for button space if needed
            var buttonSpace = hasFrameLink ? 80 : 0 // Space for button + gap
            var textTop =
              containerHeight - textBottom - textHeight - buttonSpace

            return {
              left: textLeft,
              top: Math.max(80, textTop), // Ensure text doesn't overlap with header (top:32px + 32px height + 16px padding)
              width: textWidth,
              height: textHeight,
            }
          }

          // Build the story UI
          // Escapers for safe inline HTML
          function escapeHtml(str) {
            if (str == null) return ''
            return String(str)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\"/g, '&quot;')
              .replace(/'/g, '&#39;')
          }
          function escapeAttr(str) {
            if (str == null) return ''
            return String(str)
              .replace(/&/g, '&amp;')
              .replace(/\"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
          }

          // Store button data for creating buttons outside slides
          var buttonData = []

          var slides = frames.map(function (frame, idx) {
            // Handle ad frames
            if (frame.type === 'ad' && frame.adConfig) {
              var progress =
                '<div style="position:absolute;left:16px;right:16px;top:16px;z-index:20;display:flex;gap:4px;">' +
                Array.from({ length: frames.length })
                  .map(function (_, i) {
                    return (
                      '<div style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.3);overflow:hidden;"><div class="progress-bar" data-idx="' +
                      i +
                      '" style="height:100%;border-radius:2px;background:#fff;width:0%;transition:width 0.3s;"></div></div>'
                    )
                  })
                  .join('') +
                '</div>'

              // Frame Link Button for ad frames - store data instead of creating HTML
              var adLinkClickHandler = ''
              if (frame.link) {
                // Calculate button size based on aspect ratio
                var isLandscape = story.format === 'landscape'
                var aspectRatio = width / height
                var isWide = aspectRatio > 1.2 // Wide aspect ratio (landscape video player)

                // Button size calculations based on aspect ratio
                var buttonPadding = isWide ? '8px 16px' : '12px 24px'
                var buttonFontSize = isWide ? '12px' : '15px'
                var buttonLeft = isWide ? '50%' : '16px'
                var buttonRight = isWide ? 'auto' : '16px'
                var buttonTransform = isWide ? 'translateX(-50%)' : 'none'
                var buttonMaxWidth = isWide ? '80%' : 'auto'
                var buttonTop = height - 80 + 'px' // Position from bottom (32px bottom + ~48px button height)

                // Use frame-specific link text or default
                var linkButtonText =
                  frame.linkText && frame.linkText.trim()
                    ? frame.linkText.trim()
                    : 'Read More'

                // Store button data instead of creating HTML
                buttonData.push({
                  idx: idx,
                  link: frame.link,
                  text: linkButtonText,
                  left: buttonLeft,
                  top: buttonTop,
                  transform: buttonTransform,
                  marginLeft: '0',
                  maxWidth: buttonMaxWidth,
                  padding: buttonPadding,
                  fontSize: buttonFontSize,
                })

                // Remove parent slide click handler when button exists (navigation still works via nav areas)
                adLinkClickHandler = ''
              }

              return (
                '<div class="slide' +
                (frame.link ? ' has-link' : '') +
                '" ' +
                adLinkClickHandler +
                ' style="position:absolute;top:0;left:0;width:100%;height:100%;background:#000;border-radius:' +
                frameStyle.innerBorderRadius +
                ';overflow:hidden;">' +
                progress +
                '<div id="' +
                frame.adConfig.adId +
                '" class="ad-frame" style="width:100%;height:100%;"></div>' +
                '</div>'
              )
            }

            // Handle regular story frames
            var bg = ''
            var bgImg = ''
            if (frame.background) {
              if (frame.background.type === 'color') {
                bg = 'background:' + frame.background.value + ';'
              } else if (frame.background.type === 'image') {
                bg = 'background:#000;'
                bgImg =
                  '<img src="' +
                  frame.background.value +
                  '" style="position:absolute;left:50%;top:50%;width:100%;height:100%;object-fit:cover;transform:translate(-50%,-50%);z-index:0;border-radius:' +
                  frameStyle.innerBorderRadius +
                  ';" />'
              }
            }
            // Track text element position for button placement
            var textElementBottom = null
            var textElementLeft = null
            var textElementWidth = null

            var elementsHtml = (frame.elements || [])
              .map(function (el) {
                var style = ''
                var elementWidth = el.width
                var elementHeight = el.height
                var elementLeft = el.x
                var elementTop = el.y

                // For text elements, calculate position based on format/deviceFrame
                if (el.type === 'text') {
                  var textPos = calculateTextElementPosition(
                    el,
                    width,
                    height,
                    story.format,
                    story.deviceFrame,
                    !!frame.link
                  )
                  elementWidth = textPos.width
                  elementHeight = textPos.height
                  elementLeft = textPos.left
                  elementTop = textPos.top

                  // Store text element position for button placement
                  // Since height is auto, estimate actual height (at least min-height)
                  var estimatedHeight = Math.max(
                    elementHeight,
                    Math.max(24, Math.round(el.height || 0))
                  )
                  textElementBottom = elementTop + estimatedHeight
                  textElementLeft = elementLeft
                  textElementWidth = elementWidth
                }

                style =
                  'position:absolute;left:' +
                  elementLeft +
                  'px;top:' +
                  elementTop +
                  'px;width:' +
                  elementWidth +
                  'px;height:' +
                  elementHeight +
                  'px;'
                if (el.type === 'text') {
                  var minH = Math.max(24, Math.round(elementHeight || 0))
                  style +=
                    'color:' +
                    (el.style.color || '#fff') +
                    ';font-size:' +
                    (el.style.fontSize || 18) +
                    'px;font-family:' +
                    (el.style.fontFamily || 'inherit') +
                    ';font-weight:' +
                    (el.style.fontWeight || 'normal') +
                    ';background:' +
                    (el.style.backgroundColor || 'transparent') +
                    ';opacity:' +
                    (el.style.opacity || 100) / 100 +
                    ';display:flex;align-items:center;justify-content:center;text-align:center;padding:2px;' +
                    'height:auto;min-height:' +
                    minH +
                    'px;z-index:5;word-break:break-word;overflow-wrap:break-word;'
                  return (
                    '<div style="' +
                    style +
                    '">' +
                    escapeHtml(el.content || '') +
                    '</div>'
                  )
                }
                if (el.type === 'image') {
                  return (
                    '<img src="' +
                    el.mediaUrl +
                    '" style="' +
                    style +
                    'object-fit:cover;border-radius:8px;" />'
                  )
                }
                return ''
              })
              .join('')

            // Publisher info/header
            var header = ''
            if (story.publisherName || story.storyTitle) {
              header =
                '<div style="position:absolute;left:16px;right:16px;top:32px;z-index:10;display:flex;align-items:center;gap:12px;">' +
                (story.publisherPic
                  ? '<img src="' +
                    story.publisherPic +
                    '" style="height:32px;width:32px;border-radius:50%;border:2px solid #fff;object-fit:cover;" />'
                  : '<div style="height:32px;width:32px;border-radius:50%;border:2px solid #fff;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">PP</div>') +
                '<div style="flex:1;"><div style="color:#fff;font-weight:600;font-size:15px;">' +
                escapeHtml(story.publisherName || '') +
                '</div><div style="color:#fff;opacity:0.8;font-size:12px;">' +
                escapeHtml(story.storyTitle || '') +
                '</div></div>' +
                '<div style="color:#fff;font-size:12px;">' +
                (idx + 1) +
                '/' +
                frames.length +
                '</div>' +
                '</div>'
            }

            // Store button data for creating buttons outside slides
            var frameLinkButton = ''
            var linkClickHandler = ''
            if (frame.link) {
              // Calculate button size based on aspect ratio
              var isLandscape = story.format === 'landscape'
              var aspectRatio = width / height
              var isWide = aspectRatio > 1.2 // Wide aspect ratio (landscape video player)

              // Button size calculations based on aspect ratio
              var buttonPadding = isWide ? '8px 16px' : '12px 24px'
              var buttonFontSize = isWide ? '12px' : '15px'
              var buttonMaxWidth = isWide ? '80%' : 'auto'

              // Position button below text element with gap
              var buttonGap = 24 // Gap between text and button
              var buttonTop =
                textElementBottom !== null
                  ? textElementBottom + buttonGap
                  : height - 100 // Fallback if no text element

              // Calculate button horizontal position based on text element or aspect ratio
              var buttonLeft = ''
              var buttonTransform = ''
              var buttonMarginLeft = ''

              if (textElementLeft !== null && textElementWidth !== null) {
                // Center button relative to text element
                var buttonWidth = isWide
                  ? Math.min(textElementWidth, width * 0.8)
                  : Math.min(textElementWidth, width - 32)
                buttonLeft = textElementLeft + textElementWidth / 2 + 'px'
                buttonTransform = 'translateX(-50%)'
                buttonMarginLeft = '0'
              } else {
                // Fallback: center based on aspect ratio
                buttonLeft = isWide ? '50%' : '16px'
                buttonTransform = isWide ? 'translateX(-50%)' : 'none'
                buttonMarginLeft = isWide ? '0' : '0'
              }

              // Use frame-specific link text or default
              var linkButtonText =
                frame.linkText && frame.linkText.trim()
                  ? frame.linkText.trim()
                  : 'Read More'

              // Store button data instead of creating HTML
              buttonData.push({
                idx: idx,
                link: frame.link,
                text: linkButtonText,
                left: buttonLeft,
                top: buttonTop,
                transform: buttonTransform,
                marginLeft: buttonMarginLeft,
                maxWidth: buttonMaxWidth,
                padding: buttonPadding,
                fontSize: buttonFontSize,
              })

              // Remove parent slide click handler when button exists (navigation still works via nav areas)
              linkClickHandler = ''
            } else if (story.ctaType) {
              // Fallback to story-level CTA if no frame link
              var ctaText = ''
              if (story.ctaType === 'redirect') ctaText = 'Visit Link'
              if (story.ctaType === 'form') ctaText = 'Fill Form'
              if (story.ctaType === 'promo') ctaText = 'Get Promo'
              if (story.ctaType === 'sell') ctaText = 'Buy Now'
              frameLinkButton =
                '<div id="snappy-cta-btn" style="position:absolute;left:16px;right:16px;bottom:32px;z-index:10;"><div style="border-radius:999px;background:rgba(255,255,255,0.9);padding:12px 24px;text-align:center;backdrop-filter:blur(4px);font-weight:600;color:#111;font-size:15px;cursor:pointer;">' +
                ctaText +
                '</div></div>'
            }

            // Progress bar
            var progress =
              '<div style="position:absolute;left:16px;right:16px;top:16px;z-index:20;display:flex;gap:4px;">' +
              Array.from({ length: frames.length })
                .map(function (_, i) {
                  return (
                    '<div style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.3);overflow:hidden;"><div class="progress-bar" data-idx="' +
                    i +
                    '" style="height:100%;border-radius:2px;background:#fff;width:0%;transition:width 0.3s;"></div></div>'
                  )
                })
                .join('') +
              '</div>'

            return (
              '<div class="slide' +
              (frame.link ? ' has-link' : '') +
              '" ' +
              linkClickHandler +
              ' style="position:absolute;top:0;left:0;width:100%;height:100%;' +
              bg +
              'border-radius:' +
              frameStyle.innerBorderRadius +
              ';overflow:hidden;">' +
              progress +
              header +
              bgImg +
              '<div style="position:relative;width:100%;height:100%;z-index:10;">' +
              elementsHtml +
              '</div>' +
              '</div>'
            )
          })

          // Create buttons container outside slides
          var buttonsHtml = buttonData
            .map(function (btn) {
              return (
                '<a href="' +
                escapeAttr(btn.link) +
                '" target="_blank" rel="noopener noreferrer" class="snappy-frame-link-btn" data-frame-idx="' +
                btn.idx +
                '" onclick="event.stopPropagation(); event.preventDefault(); window.open(\'' +
                escapeAttr(btn.link) +
                "', '_blank', 'noopener,noreferrer');\" style=\"position:absolute;left:" +
                btn.left +
                ';margin-left:' +
                btn.marginLeft +
                ';top:' +
                btn.top +
                'px;z-index:70;display:none;text-decoration:none;transform:' +
                btn.transform +
                ';max-width:' +
                btn.maxWidth +
                ';pointer-events:auto;cursor:pointer;\"><div style="border-radius:999px;background:rgba(255,255,255,0.9);padding:' +
                btn.padding +
                ';text-align:center;backdrop-filter:blur(4px);font-weight:600;color:#111;font-size:' +
                btn.fontSize +
                ';cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(0,0,0,0.15);pointer-events:none;">' +
                escapeHtml(btn.text) +
                '</div></a>'
              )
            })
            .join('')

          var html =
            `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
          html,body{margin:0;padding:0;overflow:hidden;background:#111;width:100vw;height:100vh;}
          body{width:100vw;height:100vh;}
          .slide{transition:opacity 0.3s;opacity:0;pointer-events:none;width:100%;height:100%;position:absolute;top:0;left:0;}
          .slide.active{opacity:1;pointer-events:auto;z-index:1;}
          .slide.has-link.active{pointer-events:auto;cursor:pointer;z-index:2;}
          .nav-btn{display:none;}
          .nav-area{position:absolute;top:0;bottom:0;width:50%;z-index:50;}
          .nav-area.left{left:0;}
          .nav-area.right{right:0;}
          #snappy-cta-btn > div { cursor: pointer; }
          .snappy-frame-link-btn { cursor: pointer !important; pointer-events: auto !important; z-index: 70 !important; }
          .snappy-frame-link-btn > div { cursor: pointer; pointer-events: none; }
          .snappy-frame-link-btn > div:hover { background: rgba(255,255,255,1); transform: scale(1.05); }
          .ad-frame { background: #000; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        </style><script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script></head><body><div style="width:100vw;height:100vh;position:relative;margin:0 auto;background:#111;border-radius:` +
            frameStyle.innerBorderRadius +
            `;overflow:hidden;">
        ${slides.join('')}
        ${buttonsHtml}
        <div class="nav-area left" id="navLeft"></div><div class="nav-area right" id="navRight"></div>
        </div><script>
        // Initialize Google Publisher Tag
        window.googletag = window.googletag || {cmd: []};
        
        // Initialize ads for ad frames
        function initializeAds() {
          if (window.googletag && window.googletag.defineSlot) {
            // Enable services once
            window.googletag.pubads().enableSingleRequest();
            window.googletag.pubads().enableAsyncRendering();
            window.googletag.enableServices();
            
            // Create a map to track created slots
            var createdSlots = new Set();
            
            frames.forEach(function(frame) {
              if (frame.type === 'ad' && frame.adConfig) {
                var adId = frame.adConfig.adId;
                
                // Skip if we already created this slot
                if (createdSlots.has(adId)) {
                  return;
                }
                
                try {
                  // Check if slot already exists in GPT
                  var existingSlots = window.googletag.pubads().getSlots();
                  var slotExists = existingSlots.some(function(slot) {
                    try {
                      return slot.getSlotElementId() === adId;
                    } catch (e) {
                      return false;
                    }
                  });
                  
                  if (!slotExists) {
                    var slot = window.googletag.defineSlot(frame.adConfig.adUnitPath, [300, 250], adId);
                    if (slot) {
                      slot.addService(window.googletag.pubads());
                      window.googletag.display(adId);
                      createdSlots.add(adId);
                      console.log('Created ad slot:', adId);
                    }
                  } else {
                    console.log('Slot already exists:', adId);
                  }
                } catch (error) {
                  console.error('Error creating slot for', adId, ':', error);
                }
              }
            });
          }
        }
        
        // Wait for GPT to load
        if (window.googletag && window.googletag.defineSlot) {
          initializeAds();
        } else {
          window.googletag.cmd.push(initializeAds);
        }
        
        var slides=document.querySelectorAll('.slide');var idx=0;var timer=null;var story=${JSON.stringify(story)};var frames=${JSON.stringify(frames)};var loop=${loop};var frameDurations=(frames||[]).map(function(f){return (f&&f.durationMs)?f.durationMs:2500;});function animateProgressBar(i){var bars=document.querySelectorAll('.progress-bar');var dur=frameDurations[i]||2500;bars.forEach(function(bar,bidx){bar.style.transition='none';if(bidx<i){bar.style.width='100%';bar.style.transition='width 0.3s';}else if(bidx===i){bar.style.width='0%';setTimeout(function(){bar.style.transition='width '+dur+'ms linear';bar.style.width='100%';},0);}else{bar.style.width='0%';}});}function show(i){slides.forEach(function(s,j){s.classList.toggle('active',j===i);});var buttons=document.querySelectorAll('.snappy-frame-link-btn');buttons.forEach(function(btn){var btnIdx=parseInt(btn.getAttribute('data-frame-idx')||'-1');btn.style.display=btnIdx===i?'block':'none';});animateProgressBar(i);attachCTAHandler();}function next(){if(loop){idx=(idx+1)%slides.length;}else{if(idx<slides.length-1){idx++;}}show(idx);if(${autoplay}){scheduleNext();}}function prev(){if(loop){idx=(idx-1+slides.length)%slides.length;}else{if(idx>0){idx--;}}show(idx);if(${autoplay}){scheduleNext();}}document.getElementById('navLeft').onclick=prev;document.getElementById('navRight').onclick=next;function scheduleNext(){if(timer){clearTimeout(timer);}var dur=frameDurations[idx]||2500;timer=setTimeout(function(){if(loop){idx=(idx+1)%slides.length;}else{if(idx<slides.length-1){idx++;}else{return;}}show(idx);scheduleNext();},dur);}function attachCTAHandler(){var cta=document.getElementById('snappy-cta-btn');if(cta){cta.onclick=function(e){e.stopPropagation();if(story.ctaType==='redirect'&&story.ctaValue){window.open(story.ctaValue,'_blank');}else{alert('CTA clicked: '+(story.ctaType||''));}};}}function handleFrameLink(url){try{if(url){window.open(url,'_blank','noopener,noreferrer');}}catch(e){}}show(idx);if(${autoplay}){scheduleNext();}
        </script></body></html>`

          iframe.srcdoc = html

          // Clear container and append iframe directly
          container.innerHTML = ''
          container.appendChild(iframe)

          // Remove from pending requests
          pendingRequests.delete(requestKey)
        })
        .catch(function (error) {
          console.error('Failed to load story:', error)
          container.innerHTML =
            '<div style="padding:20px;text-align:center;color:#666;background:white;border-radius:12px;">Story not found or failed to load<br><small>' +
            error.message +
            '</small></div>'

          // Remove from pending requests
          pendingRequests.delete(requestKey)
        })
    }, delay)
  }

  // Helper function to get frame styling based on story's format and device frame
  function getFrameStyle(format, deviceFrame) {
    if (format === 'portrait') {
      if (deviceFrame === 'mobile') {
        return {
          border: '8px solid #d1d5db',
          borderRadius: '48px',
          innerBorderRadius: '40px',
          background: '#111',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }
      } else {
        // Video player portrait
        return {
          border: '4px solid #4b5563',
          borderRadius: '8px',
          innerBorderRadius: '4px',
          background: '#111',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }
      }
    } else {
      // Landscape format
      if (deviceFrame === 'mobile') {
        return {
          border: '6px solid #d1d5db',
          borderRadius: '32px',
          innerBorderRadius: '26px',
          background: '#111',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }
      } else {
        // Video player landscape
        return {
          border: '4px solid #4b5563',
          borderRadius: '8px',
          innerBorderRadius: '4px',
          background: '#111',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }
      }
    }
  }

  // Helper function to calculate floater dimensions based on story format and device frame
  function calculateFloaterDimensions(format, deviceFrame, size) {
    var baseDimensions = {}

    if (format === 'portrait') {
      if (deviceFrame === 'mobile') {
        baseDimensions = { width: 200, height: 350 }
      } else {
        // Video player portrait
        baseDimensions = { width: 240, height: 135 }
      }
    } else {
      // Landscape format
      if (deviceFrame === 'mobile') {
        baseDimensions = { width: 280, height: 155 }
      } else {
        // Video player landscape
        baseDimensions = { width: 360, height: 200 }
      }
    }

    // Apply size multiplier
    var sizeMultipliers = {
      small: 0.7,
      medium: 1.0,
      large: 1.3,
    }

    var multiplier = sizeMultipliers[size] || 1.0
    return {
      width: Math.round(baseDimensions.width * multiplier),
      height: Math.round(baseDimensions.height * multiplier),
    }
  }

  // Helper function to calculate regular container dimensions based on story format and device frame
  function calculateRegularContainerDimensions(format, deviceFrame) {
    if (format === 'portrait') {
      if (deviceFrame === 'mobile') {
        return { width: 360, height: 640 }
      } else {
        // Video player portrait
        return { width: 400, height: 225 }
      }
    } else {
      // Landscape format
      if (deviceFrame === 'mobile') {
        return { width: 480, height: 270 }
      } else {
        // Video player landscape
        return { width: 640, height: 360 }
      }
    }
  }
})()
