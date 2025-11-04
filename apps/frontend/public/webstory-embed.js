;(function () {
  // Default API base URL - use script's origin (where the script is hosted), not the page's origin
  var DEFAULT_API_BASE_URL = (function () {
    try {
      // Helper function to extract origin from a URL string
      function extractOrigin(urlString) {
        if (!urlString) return null
        try {
          var url = new URL(urlString)
          return url.origin
        } catch (e) {
          // If URL parsing fails, try to extract origin manually
          var match = urlString.match(/^https?:\/\/([^\/]+)/i)
          if (match) {
            var protocol =
              urlString.indexOf('https://') === 0 ? 'https://' : 'http://'
            return protocol + match[1]
          }
        }
        return null
      }

      // First, try to use document.currentScript (most reliable for synchronous scripts)
      if (typeof document !== 'undefined' && document.currentScript) {
        var currentScript = document.currentScript
        var currentSrc = currentScript.src || currentScript.getAttribute('src')
        if (currentSrc && currentSrc.indexOf('webstory-embed.js') !== -1) {
          var origin = extractOrigin(currentSrc)
          if (origin) return origin
        }
      }

      // Fallback: search through all script tags to find the one loading this script
      if (typeof document !== 'undefined') {
        var scripts = document.getElementsByTagName('script')
        for (var i = 0; i < scripts.length; i++) {
          var script = scripts[i]
          var src = script.src || script.getAttribute('src')
          if (src && src.indexOf('webstory-embed.js') !== -1) {
            var origin = extractOrigin(src)
            if (origin) return origin
          }
        }
      }

      // Last fallback: use window.location.origin (might not be correct if script is on different domain)
      if (
        typeof window !== 'undefined' &&
        window.location &&
        window.location.origin
      ) {
        return window.location.origin
      }
    } catch (e) {
      // If we can't access anything, use empty string
    }
    return ''
  })()

  // Global tracking of active floaters to prevent duplicates
  var activeFloaters = {}
  var processedEmbeds = new Set()
  var pendingRequests = new Set()
  var initTimeout = null
  var lastRequestTime = 0
  var REQUEST_THROTTLE = 1000 // Minimum 1 second between requests
  var storyDataCache = new Map() // Cache for story data to prevent duplicate API calls
  var CACHE_TTL_MS = 30000 // 30s TTL to avoid stale format/deviceFrame after edits

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
    var apiBaseUrl =
      element.getAttribute('data-api-url') || DEFAULT_API_BASE_URL

    if (!storyId) return

    // Set default dimensions immediately to prevent full-width expansion
    // These will be updated in fetchAndRenderStory based on story format and embedConfig
    var explicitWidth = element.style.width
    var explicitHeight = element.style.height

    // Check if element has computed dimensions that aren't from style
    var hasComputedSize = element.offsetWidth > 0 && element.offsetHeight > 0

    // If no explicit style dimensions, use default portrait mobile size
    // This prevents the element from expanding to full parent width
    if (!explicitWidth || !explicitHeight) {
      var defaultWidth = 360 // Default portrait mobile width
      var defaultHeight = 640 // Default portrait mobile height

      // Only set defaults if element doesn't have computed size already
      if (!hasComputedSize || element.offsetWidth > 1000) {
        element.style.cssText = `
          display: block;
          width: ${defaultWidth}px;
          height: ${defaultHeight}px;
          margin: 20px auto;
          position: relative;
        `
      } else {
        // Element has computed size, use it but ensure it's set explicitly
        var w = element.offsetWidth
        var h = element.offsetHeight
        element.style.cssText = `
          display: block;
          width: ${w}px;
          height: ${h}px;
          margin: 20px auto;
          position: relative;
        `
      }
    } else {
      // Explicit style dimensions exist, parse and apply
      var w = explicitWidth
      var h = explicitHeight
      if (typeof w === 'string' && w.includes('px')) w = parseInt(w)
      if (typeof h === 'string' && h.includes('px')) h = parseInt(h)
      // Ensure we have valid pixel values
      if (isNaN(w) || w <= 0) w = 360
      if (isNaN(h) || h <= 0) h = 640
      element.style.cssText = `
        display: block;
        width: ${w}px;
        height: ${h}px;
        margin: 20px auto;
        position: relative;
      `
    }

    // Fetch and render story (will update dimensions based on story format and embedConfig)
    fetchAndRenderStory(
      storyId,
      apiBaseUrl,
      element,
      undefined,
      false,
      null,
      undefined
    )
  }

  function processFloaterEmbed(element) {
    var storyId = element.getAttribute('data-story-id')
    var apiBaseUrl =
      element.getAttribute('data-api-url') || DEFAULT_API_BASE_URL

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
    var cachedEntry = storyDataCache.get(storyId)

    {
      // Fetch the story data to get format and device frame (cache-bust with ts)
      fetch(apiBaseUrl + '/api/stories/public/' + storyId + '?ts=' + Date.now())
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
          // Cache the story data with timestamp
          storyDataCache.set(storyId, { data: storyData, ts: Date.now() })

          var cfg = (storyData.embedConfig || {}).floater || {}
          processFloaterWithData(
            storyData,
            element,
            apiBaseUrl,
            cfg.direction || 'right',
            typeof cfg.triggerScroll === 'number' ? cfg.triggerScroll : 50,
            cfg.position || 'bottom',
            cfg.size || 'medium',
            !!cfg.autoHide,
            typeof cfg.autoHideDelay === 'number' ? cfg.autoHideDelay : 5000
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

    // Calculate floater dimensions (custom size takes precedence)
    var embedCfg = storyData.embedConfig || {}
    var floaterCfg = embedCfg.floater || {}
    var dimensions = (function () {
      var cw =
        typeof floaterCfg.customWidth === 'number'
          ? floaterCfg.customWidth
          : null
      var ch =
        typeof floaterCfg.customHeight === 'number'
          ? floaterCfg.customHeight
          : null
      if (cw && ch) return { width: cw, height: ch }
      return calculateFloaterDimensions(storyFormat, storyDeviceFrame, size)
    })()

    // Use the ins element itself as the regular container
    var regularContainer = element
    regularContainer.id = 'snappy-regular-' + storyId

    // Style the regular container based on embedConfig regular size or fallback
    var regularDimensions = (function () {
      var rc = embedCfg.regular || {}
      if (typeof rc.width === 'number' && typeof rc.height === 'number') {
        return { width: rc.width, height: rc.height }
      }
      return calculateRegularContainerDimensions(storyFormat, storyDeviceFrame)
    })()

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

    // Close button for floater embeds (respect embedConfig when available)
    var showClose = true
    try {
      var cfg = storyData.embedConfig || {}
      if (cfg.floater && typeof cfg.floater.showCloseButton === 'boolean') {
        showClose = !!cfg.floater.showCloseButton
      }
    } catch (e) {}
    if (showClose) {
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
      }
      floaterContainer.appendChild(closeButton)
    }
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
    // Read from embedConfig first, then fallback to passed parameters or defaults
    try {
      var cfg = storyData.embedConfig || {}
      // Always read from config if it exists, otherwise use passed parameter or default
      if (cfg.regular || cfg.floater) {
        if (isFloater && cfg.floater) {
          if (typeof cfg.floater.autoplay === 'boolean') {
            autoplay = cfg.floater.autoplay
          }
          if (typeof cfg.floater.loop === 'boolean') {
            loop = cfg.floater.loop
          }
        } else if (!isFloater && cfg.regular) {
          if (typeof cfg.regular.autoplay === 'boolean') {
            autoplay = cfg.regular.autoplay
          }
          if (typeof cfg.regular.loop === 'boolean') {
            loop = cfg.regular.loop
          }
        }
      }
      // Fallback to passed parameters if config doesn't have values
      if (typeof autoplay === 'undefined') {
        autoplay = false
      }
      if (typeof loop === 'undefined') {
        loop = false
      }
      // Ensure loop and autoplay are proper booleans
      loop = !!loop
      autoplay = !!autoplay
    } catch (e) {}
    console.log('Rendering story directly with data:', storyData)
    console.log('Loop value:', loop, 'Type:', typeof loop, 'Config:', cfg)
    console.log('Autoplay value:', autoplay, 'Type:', typeof autoplay)

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
      format: storyData.format || 'portrait',
      deviceFrame: storyData.deviceFrame || 'mobile',
      defaultDurationMs: storyData.defaultDurationMs || 5000,
    }

    console.log('Final story object:', story)
    console.log('Final format:', story.format)
    console.log('Final deviceFrame:', story.deviceFrame)

    // Get container dimensions
    // For floater, use iframe dimensions (after scaling); for regular, use container dimensions
    var width, height
    if (floaterOptions && floaterOptions.isFloater) {
      // For floater, the iframe is sized to floaterDims / scaleFactor
      // This is the actual size the content sees, so use it for positioning
      var floaterDims = floaterOptions.floaterDimensions
      var scaleFactor = floaterOptions.scaleFactor || 1
      width = floaterDims.width / scaleFactor
      height = floaterDims.height / scaleFactor
    } else {
      width = container.style.width || container.offsetWidth || 360
      height = container.style.height || container.offsetHeight || 700

      // Ensure dimensions are in pixels
      if (typeof width === 'string' && width.includes('px')) {
        width = parseInt(width)
      }
      if (typeof height === 'string' && height.includes('px')) {
        height = parseInt(height)
      }
    }

    // Calculate scale factor based on reference dimensions
    // Reference dimensions: portrait (360x640), landscape (640x360)
    var referenceWidth = story.format === 'landscape' ? 640 : 360
    var referenceHeight = story.format === 'landscape' ? 360 : 640
    var scaleFactor = Math.min(width / referenceWidth, height / referenceHeight)
    // Clamp scale factor to reasonable range (0.3 to 1.5)
    scaleFactor = Math.max(0.3, Math.min(1.5, scaleFactor))
    console.log(
      'Scale factor:',
      scaleFactor,
      'for dimensions:',
      width,
      'x',
      height
    )

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

    iframe.style.border = '0'
    iframe.style.borderRadius = frameStyle.borderRadius
    iframe.style.background = frameStyle.background
    iframe.style.boxShadow = frameStyle.boxShadow
    iframe.style.display = 'block'
    iframe.style.margin = '0'
    iframe.style.position = 'absolute'
    iframe.style.top = '0'
    iframe.style.left = '0'
    iframe.style.outline = 'none'
    iframe.style.boxSizing = 'border-box'
    iframe.style.zIndex = '1'
    var slideDuration = story.defaultDurationMs || 5000 // default; overridden per-frame in inline script

    // Helper function to calculate text element position and size based on format/deviceFrame
    function calculateTextElementPosition(
      el,
      containerWidth,
      containerHeight,
      format,
      deviceFrame,
      hasFrameLink,
      scaleFactor
    ) {
      // Button is fixed at bottom, text appears above it
      // Calculate button height (approximate, scaled)
      var baseButtonHeight = 44 // Base height for portrait, 36 for landscape (handled in button code)
      var buttonHeight = Math.round(baseButtonHeight * scaleFactor)
      var buttonPadding = Math.round(16 * scaleFactor) // Bottom padding for button
      var buttonMargin = Math.round(24 * scaleFactor) // Gap between text and button

      // Text positioning - button is fixed at bottom, text appears above with margin
      var textBottomPadding = hasFrameLink
        ? buttonHeight + buttonMargin + buttonPadding
        : Math.round(20 * scaleFactor)

      var textWidth, textLeft, textBottom, textHeight

      // Base text height (scaled)
      var baseTextHeight = 60
      var scaledTextHeight = Math.round(baseTextHeight * scaleFactor)

      if (format === 'portrait') {
        // Portrait (mobile and video-player): 90% width, centered, above button
        textWidth = Math.round(containerWidth * 0.9)
        textLeft = Math.round((containerWidth - textWidth) / 2)
        textBottom = textBottomPadding
        // Scale text height based on aspect ratio and container height
        textHeight = Math.max(
          scaledTextHeight,
          Math.round(containerHeight * 0.15 * scaleFactor)
        )
      } else {
        // Landscape (mobile and video-player): 50% width, centered, above button
        textWidth = Math.round(containerWidth * 0.5)
        textLeft = Math.round((containerWidth - textWidth) / 2)
        textBottom = textBottomPadding
        // Scale text height based on aspect ratio and container height
        textHeight = Math.max(
          scaledTextHeight,
          Math.round(containerHeight * 0.15 * scaleFactor)
        )
      }

      // Convert bottom to top position (since we use top in CSS)
      // Position from bottom, accounting for button space
      var textTop = containerHeight - textBottom - textHeight

      return {
        left: textLeft,
        top: Math.max(Math.round(80 * scaleFactor), textTop), // Ensure text doesn't overlap with header (scaled)
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
          // Calculate button size based on aspect ratio and scale factor
          var isLandscape = story.format === 'landscape'
          var aspectRatio = width / height
          var isWide = aspectRatio > 1.2 // Wide aspect ratio (landscape video player)

          // Base button sizes (reference dimensions)
          var basePaddingV = isWide ? 8 : 12
          var basePaddingH = isWide ? 16 : 24
          var baseFontSize = isWide ? 12 : 15
          var baseButtonHeight = isWide ? 36 : 44

          // Apply scale factor to button sizes
          var buttonPaddingV = Math.round(basePaddingV * scaleFactor)
          var buttonPaddingH = Math.round(basePaddingH * scaleFactor)
          var buttonFontSize = Math.round(baseFontSize * scaleFactor)
          // For floater embeds, ensure minimum readable font size
          if (floaterOptions && floaterOptions.isFloater) {
            buttonFontSize = Math.max(buttonFontSize, isWide ? 11 : 13)
          }
          var buttonPadding = buttonPaddingV + 'px ' + buttonPaddingH + 'px'
          var buttonFontSizePx = buttonFontSize + 'px'
          var approxButtonHeight = Math.round(baseButtonHeight * scaleFactor)

          var buttonLeft = isWide ? '50%' : Math.round(16 * scaleFactor) + 'px'
          var buttonRight = isWide ? 'auto' : 'auto'
          var buttonTransform = isWide ? 'translateX(-50%)' : 'none'
          var buttonMaxWidth = isWide ? '80%' : 'auto'

          // Button is fixed at bottom
          var buttonBottomPadding = Math.round(16 * scaleFactor) // Bottom padding for button
          var buttonBottom = buttonBottomPadding + 'px'

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
            bottom: buttonBottom, // Fixed at bottom
            transform: buttonTransform,
            marginLeft: '0',
            maxWidth: buttonMaxWidth,
            padding: buttonPadding,
            fontSize: buttonFontSizePx,
            hidden: false, // Ad frame buttons are always visible (unless overflow)
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
      // Compute background transforms from saved frame background settings
      var bgZoom = 1,
        bgX = 0,
        bgY = 0,
        bgRot = 0
      if (frame.background) {
        if (typeof frame.background.zoom === 'number')
          bgZoom = frame.background.zoom / 100
        if (typeof frame.background.offsetX === 'number')
          bgX = frame.background.offsetX
        if (typeof frame.background.offsetY === 'number')
          bgY = frame.background.offsetY
        if (typeof frame.background.rotation === 'number')
          bgRot = frame.background.rotation
      }
      if (frame.background) {
        if (frame.background.type === 'color') {
          bg = 'background:' + frame.background.value + ';'
        } else if (frame.background.type === 'image') {
          bg = 'background:#000;'
          bgImg =
            // Background: blurred cover fill layer
            '<img src="' +
            frame.background.value +
            '" style="position:absolute;left:50%;top:50%;width:100%;height:100%;object-fit:cover;transform:translate(-50%,-50%);z-index:0;filter:blur(20px) brightness(0.85);border-radius:' +
            frameStyle.innerBorderRadius +
            ';" />' +
            // Foreground: main image using contain so it is not over-zoomed
            '<img src="' +
            frame.background.value +
            '" style="position:absolute;left:50%;top:50%;width:100%;height:100%;object-fit:contain;transform:translate(-50%,-50%) translate(' +
            bgX +
            'px, ' +
            bgY +
            'px) rotate(' +
            bgRot +
            'deg) scale(' +
            bgZoom +
            ');z-index:1;border-radius:' +
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
              !!frame.link,
              scaleFactor
            )
            elementWidth = textPos.width
            elementHeight = textPos.height
            elementLeft = textPos.left
            elementTop = textPos.top

            // Store text element position for button placement
            // Since height is auto, estimate actual height (at least min-height)
            var estimatedHeight = Math.max(
              elementHeight,
              Math.max(Math.round(24 * scaleFactor), Math.round(el.height || 0))
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
            var minH = Math.max(
              Math.round(24 * scaleFactor),
              Math.round(elementHeight || 0)
            )
            // Apply scale factor to font size
            var baseFontSize = el.style.fontSize || 18
            var scaledFontSize = Math.round(baseFontSize * scaleFactor)
            // For floater embeds, ensure minimum readable font size
            if (floaterOptions && floaterOptions.isFloater) {
              scaledFontSize = Math.max(scaledFontSize, 12)
            }
            style +=
              'color:' +
              (el.style.color || '#fff') +
              ';font-size:' +
              scaledFontSize +
              'px;font-family:' +
              (el.style.fontFamily || 'inherit') +
              ';font-weight:' +
              (el.style.fontWeight || 'normal') +
              ';background:' +
              (el.style.backgroundColor || 'transparent') +
              ';opacity:' +
              (el.style.opacity || 100) / 100 +
              ';display:flex;align-items:center;justify-content:center;text-align:center;padding:' +
              Math.round(2 * scaleFactor) +
              'px;' +
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
        // Calculate button size based on aspect ratio and scale factor
        var isLandscape = story.format === 'landscape'
        var aspectRatio = width / height
        var isWide = aspectRatio > 1.2 // Wide aspect ratio (landscape video player)

        // Base button sizes (reference dimensions)
        var basePaddingV = isWide ? 8 : 12
        var basePaddingH = isWide ? 16 : 24
        var baseFontSize = isWide ? 12 : 15

        // Apply scale factor to button sizes
        var buttonPaddingV = Math.round(basePaddingV * scaleFactor)
        var buttonPaddingH = Math.round(basePaddingH * scaleFactor)
        var buttonFontSize = Math.round(baseFontSize * scaleFactor)
        // For floater embeds, ensure minimum readable font size
        if (floaterOptions && floaterOptions.isFloater) {
          buttonFontSize = Math.max(buttonFontSize, isWide ? 11 : 13)
        }
        var buttonPadding = buttonPaddingV + 'px ' + buttonPaddingH + 'px'
        var buttonFontSizePx = buttonFontSize + 'px'
        var buttonMaxWidth = isWide ? '80%' : 'auto'

        // Button is fixed at bottom
        var buttonBottomPadding = Math.round(16 * scaleFactor) // Bottom padding for button
        var buttonBottom = buttonBottomPadding + 'px'

        // Calculate button horizontal position based on text element or aspect ratio
        var buttonLeft = ''
        var buttonTransform = ''
        var buttonMarginLeft = ''

        if (textElementLeft !== null && textElementWidth !== null) {
          // Center button relative to text element
          var buttonWidth = isWide
            ? Math.min(textElementWidth, width * 0.8)
            : Math.min(textElementWidth, width - Math.round(32 * scaleFactor))
          buttonLeft = textElementLeft + textElementWidth / 2 + 'px'
          buttonTransform = 'translateX(-50%)'
          buttonMarginLeft = '0'
        } else {
          // Fallback: center based on aspect ratio
          buttonLeft = isWide ? '50%' : Math.round(16 * scaleFactor) + 'px'
          buttonTransform = isWide ? 'translateX(-50%)' : 'none'
          buttonMarginLeft = isWide ? '0' : '0'
        }

        // Use frame-specific link text or default
        var linkButtonText =
          frame.linkText && frame.linkText.trim()
            ? frame.linkText.trim()
            : 'Read More'

        // Store button data instead of creating inline HTML (for consistent visibility handling)
        buttonData.push({
          idx: idx,
          link: frame.link,
          text: linkButtonText,
          left: buttonLeft,
          bottom: buttonBottom, // Fixed at bottom
          transform: buttonTransform,
          marginLeft: buttonMarginLeft,
          maxWidth: buttonMaxWidth,
          padding: buttonPadding,
          fontSize: buttonFontSizePx,
          hidden: false, // Regular frame buttons are always visible (unless overflow)
        })

        // Remove parent slide click handler when button exists (navigation still works via nav areas)
        linkClickHandler = ''
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
      .filter(function (btn) {
        return !btn.hidden
      })
      .map(function (btn) {
        // Use bottom if available (for fixed bottom positioning), otherwise use top
        var positionStyle = btn.bottom
          ? 'bottom:' + btn.bottom + ';'
          : 'top:' + (btn.top || '0px') + ';'
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
          ';' +
          positionStyle +
          'z-index:70;display:none;text-decoration:none;transform:' +
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
    
    var slides=document.querySelectorAll('.slide');var idx=0;var timer=null;var story=${JSON.stringify(story)};var frames=${JSON.stringify(frames)};var loop=${!!loop};var defaultDur=story.defaultDurationMs||5000;var frameDurations=(frames||[]).map(function(f){return (f&&typeof f.durationMs==='number'&&f.durationMs>0)?f.durationMs:defaultDur;});function animateProgressBar(i){var activeSlide=slides[i];if(!activeSlide)return;var bars=activeSlide.querySelectorAll('.progress-bar');var dur=frameDurations[i]||defaultDur;bars.forEach(function(bar,bidx){var dataIdx=parseInt(bar.getAttribute('data-idx')||bidx);if(dataIdx<i){bar.style.transition='none';bar.style.width='100%';}else if(dataIdx===i){bar.style.transition='none';bar.style.width='0%';bar.style.display='block';setTimeout(function(){bar.style.transition='width '+dur+'ms linear';bar.style.width='100%';},10);}else{bar.style.transition='none';bar.style.width='0%';}});}function show(i){slides.forEach(function(s,j){s.classList.toggle('active',j===i);});var buttons=document.querySelectorAll('.snappy-frame-link-btn');buttons.forEach(function(btn){var btnIdx=parseInt(btn.getAttribute('data-frame-idx')||'-1');btn.style.display=btnIdx===i?'block':'none';});animateProgressBar(i);}function next(){if(loop){idx=(idx+1)%slides.length;}else{if(idx<slides.length-1){idx++;}else{return;}}show(idx);if(${!!autoplay}){scheduleNext();}}function prev(){if(loop){idx=(idx-1+slides.length)%slides.length;}else{if(idx>0){idx--;}else{return;}}show(idx);if(${!!autoplay}){scheduleNext();}}document.getElementById('navLeft').onclick=prev;document.getElementById('navRight').onclick=next;function scheduleNext(){if(timer){clearTimeout(timer);}var dur=frameDurations[idx]||defaultDur;timer=setTimeout(function(){if(loop){idx=(idx+1)%slides.length;}else{if(idx<slides.length-1){idx++;}else{return;}}show(idx);if(loop){scheduleNext();}else if(idx<slides.length-1){scheduleNext();}},dur);}function handleFrameLink(url){try{if(url){window.open(url,'_blank','noopener,noreferrer');}}catch(e){}}show(idx);if(${!!autoplay}){scheduleNext();}
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
      fetch(apiBaseUrl + '/api/stories/public/' + storyId + '?ts=' + Date.now())
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

          // Resolve autoplay/loop from embedConfig - always prefer config over passed parameters
          var cfg = storyData.embedConfig || {}
          // Always read from config if it exists, otherwise use passed parameter or default
          if (cfg.regular || cfg.floater) {
            if (isFloater && cfg.floater) {
              if (typeof cfg.floater.autoplay === 'boolean') {
                autoplay = cfg.floater.autoplay
              }
              if (typeof cfg.floater.loop === 'boolean') {
                loop = cfg.floater.loop
              }
            } else if (!isFloater && cfg.regular) {
              if (typeof cfg.regular.autoplay === 'boolean') {
                autoplay = cfg.regular.autoplay
              }
              if (typeof cfg.regular.loop === 'boolean') {
                loop = cfg.regular.loop
              }
            }
          }
          // Fallback to passed parameters if config doesn't have values
          if (typeof autoplay === 'undefined') {
            autoplay = false
          }
          if (typeof loop === 'undefined') {
            loop = false
          }
          // Ensure loop and autoplay are proper booleans
          loop = !!loop
          autoplay = !!autoplay
          console.log('Loop value:', loop, 'Type:', typeof loop, 'Config:', cfg)
          console.log('Autoplay value:', autoplay, 'Type:', typeof autoplay)

          // Cache the story data with timestamp to prevent staleness
          storyDataCache.set(storyId, { data: storyData, ts: Date.now() })

          var frames = storyData.frames || []
          var story = {
            storyTitle: storyData.title,
            publisherName: storyData.publisherName,
            publisherPic: storyData.publisherPic,
            format: storyData.format || 'portrait',
            deviceFrame: storyData.deviceFrame || 'mobile',
            defaultDurationMs: storyData.defaultDurationMs || 5000,
          }

          console.log('Final story object:', story)
          console.log('Final format:', story.format)
          console.log('Final deviceFrame:', story.deviceFrame)

          // Determine ideal container dimensions from story format/device frame
          var idealDims = (function () {
            // Prefer explicit sizes from embedConfig.regular when provided
            var rc = cfg.regular || {}
            if (typeof rc.width === 'number' && typeof rc.height === 'number') {
              var w = rc.width
              var h = rc.height
              // If saved size aspect ratio conflicts with story orientation, ignore saved size
              var isLandscapeSize = w > h
              var expectLandscape = story.format === 'landscape'
              if (isLandscapeSize === expectLandscape) {
                return { width: w, height: h }
              }
              // mismatch → fall through to calculated dims
            }
            return calculateRegularContainerDimensions(
              story.format,
              story.deviceFrame
            )
          })()

          // Always apply ideal dimensions to container (from embedConfig or calculated)
          // This ensures consistent sizing regardless of initial element state
          container.style.cssText = `
            display: block;
            width: ${idealDims.width}px;
            height: ${idealDims.height}px;
            margin: 20px auto;
            position: relative;
            max-width: ${idealDims.width}px;
            max-height: ${idealDims.height}px;
            box-sizing: border-box;
            overflow: hidden;
          `

          // Use the ideal dimensions directly
          // For floater, use iframe dimensions (after scaling); for regular, use ideal dimensions
          var width, height
          if (floaterOptions && floaterOptions.isFloater) {
            // For floater, the iframe is sized to floaterDims / scaleFactor
            // This is the actual size the content sees, so use it for positioning
            var floaterDims = floaterOptions.floaterDimensions
            var scaleFactor = floaterOptions.scaleFactor || 1
            width = floaterDims.width / scaleFactor
            height = floaterDims.height / scaleFactor
          } else {
            width = idealDims.width
            height = idealDims.height
          }

          // Calculate scale factor based on reference dimensions
          // Reference dimensions: portrait (360x640), landscape (640x360)
          var referenceWidth = story.format === 'landscape' ? 640 : 360
          var referenceHeight = story.format === 'landscape' ? 360 : 640
          var scaleFactor = Math.min(
            width / referenceWidth,
            height / referenceHeight
          )
          // Clamp scale factor to reasonable range (0.3 to 1.5)
          scaleFactor = Math.max(0.3, Math.min(1.5, scaleFactor))
          console.log(
            'Scale factor:',
            scaleFactor,
            'for dimensions:',
            width,
            'x',
            height
          )

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

          iframe.style.border = '0'
          iframe.style.borderRadius = frameStyle.borderRadius
          iframe.style.background = frameStyle.background
          iframe.style.boxShadow = frameStyle.boxShadow
          iframe.style.display = 'block'
          iframe.style.margin = '0'
          iframe.style.position = 'absolute'
          iframe.style.top = '0'
          iframe.style.left = '0'
          iframe.style.outline = 'none'
          iframe.style.boxSizing = 'border-box'
          iframe.style.zIndex = '1'
          var slideDuration = story.defaultDurationMs || 5000 // default; overridden per-frame in inline script

          // Helper function to calculate text element position and size based on format/deviceFrame
          function calculateTextElementPosition(
            el,
            containerWidth,
            containerHeight,
            format,
            deviceFrame,
            hasFrameLink,
            scaleFactor
          ) {
            // Button is fixed at bottom, text appears above it
            // Calculate button height (approximate, scaled)
            var baseButtonHeight = 44 // Base height for portrait, 36 for landscape (handled in button code)
            var buttonHeight = Math.round(baseButtonHeight * scaleFactor)
            var buttonPadding = Math.round(16 * scaleFactor) // Bottom padding for button
            var buttonMargin = Math.round(24 * scaleFactor) // Gap between text and button

            // Text positioning - button is fixed at bottom, text appears above with margin
            var textBottomPadding = hasFrameLink
              ? buttonHeight + buttonMargin + buttonPadding
              : Math.round(20 * scaleFactor)

            var textWidth, textLeft, textBottom, textHeight

            // Base text height (scaled)
            var baseTextHeight = 60
            var scaledTextHeight = Math.round(baseTextHeight * scaleFactor)

            if (format === 'portrait') {
              // Portrait (mobile and video-player): 90% width, centered, above button
              textWidth = Math.round(containerWidth * 0.9)
              textLeft = Math.round((containerWidth - textWidth) / 2)
              textBottom = textBottomPadding
              // Scale text height based on aspect ratio and container height
              textHeight = Math.max(
                scaledTextHeight,
                Math.round(containerHeight * 0.15 * scaleFactor)
              )
            } else {
              // Landscape (mobile and video-player): 50% width, centered, above button
              textWidth = Math.round(containerWidth * 0.5)
              textLeft = Math.round((containerWidth - textWidth) / 2)
              textBottom = textBottomPadding
              // Scale text height based on aspect ratio and container height
              textHeight = Math.max(
                scaledTextHeight,
                Math.round(containerHeight * 0.15 * scaleFactor)
              )
            }

            // Convert bottom to top position (since we use top in CSS)
            // Position from bottom, accounting for button space
            var textTop = containerHeight - textBottom - textHeight

            return {
              left: textLeft,
              top: Math.max(Math.round(80 * scaleFactor), textTop), // Ensure text doesn't overlap with header (scaled)
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
                // Calculate button size based on aspect ratio and scale factor
                var isLandscape = story.format === 'landscape'
                var aspectRatio = width / height
                var isWide = aspectRatio > 1.2 // Wide aspect ratio (landscape video player)

                // Base button sizes (reference dimensions)
                var basePaddingV = isWide ? 8 : 12
                var basePaddingH = isWide ? 16 : 24
                var baseFontSize = isWide ? 12 : 15
                var baseButtonHeight = isWide ? 36 : 44

                // Apply scale factor to button sizes
                var buttonPaddingV = Math.round(basePaddingV * scaleFactor)
                var buttonPaddingH = Math.round(basePaddingH * scaleFactor)
                var buttonFontSize = Math.round(baseFontSize * scaleFactor)
                // For floater embeds, ensure minimum readable font size
                if (floaterOptions && floaterOptions.isFloater) {
                  buttonFontSize = Math.max(buttonFontSize, isWide ? 11 : 13)
                }
                var buttonPadding =
                  buttonPaddingV + 'px ' + buttonPaddingH + 'px'
                var buttonFontSizePx = buttonFontSize + 'px'
                var approxButtonHeight = Math.round(
                  baseButtonHeight * scaleFactor
                )

                var buttonLeft = isWide
                  ? '50%'
                  : Math.round(16 * scaleFactor) + 'px'
                var buttonRight = isWide ? 'auto' : 'auto'
                var buttonTransform = isWide ? 'translateX(-50%)' : 'none'
                var buttonMaxWidth = isWide ? '80%' : 'auto'
                // Button is fixed at bottom
                var buttonBottomPadding = Math.round(16 * scaleFactor) // Bottom padding for button
                var buttonBottom = buttonBottomPadding + 'px'

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
                  bottom: buttonBottom, // Fixed at bottom
                  transform: buttonTransform,
                  marginLeft: '0',
                  maxWidth: buttonMaxWidth,
                  padding: buttonPadding,
                  fontSize: buttonFontSizePx,
                  hidden: false, // Ad frame buttons are always visible (unless overflow)
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
            // Compute background transforms from saved frame background settings
            var bgZoom = 1,
              bgX = 0,
              bgY = 0,
              bgRot = 0
            if (frame.background) {
              if (typeof frame.background.zoom === 'number')
                bgZoom = frame.background.zoom / 100
              if (typeof frame.background.offsetX === 'number')
                bgX = frame.background.offsetX
              if (typeof frame.background.offsetY === 'number')
                bgY = frame.background.offsetY
              if (typeof frame.background.rotation === 'number')
                bgRot = frame.background.rotation
            }
            if (frame.background) {
              if (frame.background.type === 'color') {
                bg = 'background:' + frame.background.value + ';'
              } else if (frame.background.type === 'image') {
                bg = 'background:#000;'
                bgImg =
                  // Background: blurred cover fill layer
                  '<img src="' +
                  frame.background.value +
                  '" style="position:absolute;left:50%;top:50%;width:100%;height:100%;object-fit:cover;transform:translate(-50%,-50%);z-index:0;filter:blur(20px) brightness(0.85);border-radius:' +
                  frameStyle.innerBorderRadius +
                  ';" />' +
                  // Foreground: main image using contain so it is not over-zoomed
                  '<img src="' +
                  frame.background.value +
                  '" style="position:absolute;left:50%;top:50%;width:100%;height:100%;object-fit:contain;transform:translate(-50%,-50%) translate(' +
                  bgX +
                  'px, ' +
                  bgY +
                  'px) rotate(' +
                  bgRot +
                  'deg) scale(' +
                  bgZoom +
                  ');z-index:1;border-radius:' +
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
                    !!frame.link,
                    scaleFactor
                  )
                  elementWidth = textPos.width
                  elementHeight = textPos.height
                  elementLeft = textPos.left
                  elementTop = textPos.top

                  // Store text element position for button placement
                  // Since height is auto, estimate actual height (at least min-height)
                  var estimatedHeight = Math.max(
                    elementHeight,
                    Math.max(
                      Math.round(24 * scaleFactor),
                      Math.round(el.height || 0)
                    )
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
                  var minH = Math.max(
                    Math.round(24 * scaleFactor),
                    Math.round(elementHeight || 0)
                  )
                  // Apply scale factor to font size
                  var baseFontSize = el.style.fontSize || 18
                  var scaledFontSize = Math.round(baseFontSize * scaleFactor)
                  // For floater embeds, ensure minimum readable font size
                  if (floaterOptions && floaterOptions.isFloater) {
                    scaledFontSize = Math.max(scaledFontSize, 12)
                  }
                  style +=
                    'color:' +
                    (el.style.color || '#fff') +
                    ';font-size:' +
                    scaledFontSize +
                    'px;font-family:' +
                    (el.style.fontFamily || 'inherit') +
                    ';font-weight:' +
                    (el.style.fontWeight || 'normal') +
                    ';background:' +
                    (el.style.backgroundColor || 'transparent') +
                    ';opacity:' +
                    (el.style.opacity || 100) / 100 +
                    ';display:flex;align-items:center;justify-content:center;text-align:center;padding:' +
                    Math.round(2 * scaleFactor) +
                    'px;' +
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
              // Calculate button size based on aspect ratio and scale factor
              var isLandscape = story.format === 'landscape'
              var aspectRatio = width / height
              var isWide = aspectRatio > 1.2 // Wide aspect ratio (landscape video player)

              // Base button sizes (reference dimensions)
              var basePaddingV = isWide ? 8 : 12
              var basePaddingH = isWide ? 16 : 24
              var baseFontSize = isWide ? 12 : 15

              // Apply scale factor to button sizes
              var buttonPaddingV = Math.round(basePaddingV * scaleFactor)
              var buttonPaddingH = Math.round(basePaddingH * scaleFactor)
              var buttonFontSize = Math.round(baseFontSize * scaleFactor)
              // For floater embeds, ensure minimum readable font size
              if (floaterOptions && floaterOptions.isFloater) {
                buttonFontSize = Math.max(buttonFontSize, isWide ? 11 : 13)
              }
              var buttonPadding = buttonPaddingV + 'px ' + buttonPaddingH + 'px'
              var buttonFontSizePx = buttonFontSize + 'px'
              var buttonMaxWidth = isWide ? '80%' : 'auto'

              // Button is fixed at bottom
              var buttonBottomPadding = Math.round(16 * scaleFactor) // Bottom padding for button
              var buttonBottom = buttonBottomPadding + 'px'

              // Calculate button horizontal position based on text element or aspect ratio
              var buttonLeft = ''
              var buttonTransform = ''
              var buttonMarginLeft = ''

              if (textElementLeft !== null && textElementWidth !== null) {
                // Center button relative to text element
                var buttonWidth = isWide
                  ? Math.min(textElementWidth, width * 0.8)
                  : Math.min(
                      textElementWidth,
                      width - Math.round(32 * scaleFactor)
                    )
                buttonLeft = textElementLeft + textElementWidth / 2 + 'px'
                buttonTransform = 'translateX(-50%)'
                buttonMarginLeft = '0'
              } else {
                // Fallback: center based on aspect ratio
                buttonLeft = isWide
                  ? '50%'
                  : Math.round(16 * scaleFactor) + 'px'
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
                bottom: buttonBottom, // Fixed at bottom
                transform: buttonTransform,
                marginLeft: buttonMarginLeft,
                maxWidth: buttonMaxWidth,
                padding: buttonPadding,
                fontSize: buttonFontSizePx,
                hidden: false, // Regular frame buttons are always visible (unless overflow)
              })

              // Remove parent slide click handler when button exists (navigation still works via nav areas)
              linkClickHandler = ''
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
            .filter(function (btn) {
              return !btn.hidden
            })
            .map(function (btn) {
              // Use bottom if available (for fixed bottom positioning), otherwise use top
              var positionStyle = btn.bottom
                ? 'bottom:' + btn.bottom + ';'
                : 'top:' + (btn.top || '0px') + ';'
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
                ';' +
                positionStyle +
                'z-index:70;display:none;text-decoration:none;transform:' +
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
        
        var slides=document.querySelectorAll('.slide');var idx=0;var timer=null;var story=${JSON.stringify(story)};var frames=${JSON.stringify(frames)};var loop=${!!loop};var defaultDur=story.defaultDurationMs||5000;var frameDurations=(frames||[]).map(function(f){return (f&&typeof f.durationMs==='number'&&f.durationMs>0)?f.durationMs:defaultDur;});function animateProgressBar(i){var activeSlide=slides[i];if(!activeSlide)return;var bars=activeSlide.querySelectorAll('.progress-bar');var dur=frameDurations[i]||defaultDur;bars.forEach(function(bar,bidx){var dataIdx=parseInt(bar.getAttribute('data-idx')||bidx);if(dataIdx<i){bar.style.transition='none';bar.style.width='100%';}else if(dataIdx===i){bar.style.transition='none';bar.style.width='0%';bar.style.display='block';setTimeout(function(){bar.style.transition='width '+dur+'ms linear';bar.style.width='100%';},10);}else{bar.style.transition='none';bar.style.width='0%';}});}function show(i){slides.forEach(function(s,j){s.classList.toggle('active',j===i);});var buttons=document.querySelectorAll('.snappy-frame-link-btn');buttons.forEach(function(btn){var btnIdx=parseInt(btn.getAttribute('data-frame-idx')||'-1');btn.style.display=btnIdx===i?'block':'none';});animateProgressBar(i);}function next(){if(loop){idx=(idx+1)%slides.length;}else{if(idx<slides.length-1){idx++;}else{return;}}show(idx);if(${!!autoplay}){scheduleNext();}}function prev(){if(loop){idx=(idx-1+slides.length)%slides.length;}else{if(idx>0){idx--;}else{return;}}show(idx);if(${!!autoplay}){scheduleNext();}}document.getElementById('navLeft').onclick=prev;document.getElementById('navRight').onclick=next;function scheduleNext(){if(timer){clearTimeout(timer);}var dur=frameDurations[idx]||defaultDur;timer=setTimeout(function(){if(loop){idx=(idx+1)%slides.length;}else{if(idx<slides.length-1){idx++;}else{return;}}show(idx);if(loop){scheduleNext();}else if(idx<slides.length-1){scheduleNext();}},dur);}function handleFrameLink(url){try{if(url){window.open(url,'_blank','noopener,noreferrer');}}catch(e){}}show(idx);if(${!!autoplay}){scheduleNext();}
        </script></body></html>`

          iframe.srcdoc = html

          // Clear container and append iframe directly
          container.innerHTML = ''
          container.appendChild(iframe)

          // If embedConfig requests floater, initialize it too (feature parity)
          try {
            var floaterCfg = cfg.floater || {}
            var floaterEnabled = !!(
              cfg.type === 'floater' || floaterCfg.enabled
            )
            var hasExplicitFloater =
              container.getAttribute('data-floater') === 'true'
            if (floaterEnabled && !hasExplicitFloater) {
              processFloaterWithData(
                storyData,
                container,
                apiBaseUrl,
                floaterCfg.direction || 'right',
                typeof floaterCfg.triggerScroll === 'number'
                  ? floaterCfg.triggerScroll
                  : 50,
                floaterCfg.position || 'bottom',
                floaterCfg.size || 'medium',
                !!floaterCfg.autoHide,
                typeof floaterCfg.autoHideDelay === 'number'
                  ? floaterCfg.autoHideDelay
                  : 5000
              )
            }
          } catch (e) {
            console.warn('Floater initialization skipped:', e)
          }

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
