;(function () {
  // Global tracking of active floaters to prevent duplicates
  var activeFloaters = {}

  // Handle both regular and floater embeds
  var regularScripts = document.querySelectorAll(
    'script[data-story-id]:not([data-floater="true"])'
  )
  var floaterScripts = document.querySelectorAll(
    'script[data-story-id][data-floater="true"]'
  )

  // Process regular embeds
  regularScripts.forEach(function (script) {
    processRegularEmbed(script)
  })

  // Process floater embeds
  floaterScripts.forEach(function (script) {
    processFloaterEmbed(script)
  })

  function processRegularEmbed(script) {
    var storyId = script.getAttribute('data-story-id')
    var autoplay = script.getAttribute('data-autoplay') === 'true'
    var container = script.previousElementSibling
    if (!container || !storyId) return

    // Get the API base URL from the script tag or use relative URL
    var apiBaseUrl = script.getAttribute('data-api-url') || ''

    // Fetch and render story
    fetchAndRenderStory(storyId, apiBaseUrl, container, autoplay, false)
  }

  function processFloaterEmbed(script) {
    var storyId = script.getAttribute('data-story-id')
    var direction = script.getAttribute('data-direction') || 'right'
    var triggerScroll = parseInt(
      script.getAttribute('data-trigger-scroll') || '50'
    )
    var position = script.getAttribute('data-position') || 'bottom'
    var size = script.getAttribute('data-size') || 'medium'
    var autoHide = script.getAttribute('data-auto-hide') === 'true'
    var autoHideDelay = parseInt(
      script.getAttribute('data-auto-hide-delay') || '5000'
    )
    var apiBaseUrl = script.getAttribute('data-api-url') || ''

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

    // First, create a regular embed container for the story
    var regularContainer = document.createElement('div')
    regularContainer.id = 'snappy-regular-' + storyId

    // Insert the regular container before the script tag
    script.parentNode.insertBefore(regularContainer, script)

    // First, fetch the story data to get format and device frame
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
        var storyFormat = storyData.format || 'portrait'
        var storyDeviceFrame = storyData.deviceFrame || 'mobile'

        // Calculate dimensions based on story's actual format and device frame
        var dimensions = calculateFloaterDimensions(
          storyFormat,
          storyDeviceFrame,
          size
        )

        // Style the regular container based on story format and device frame
        var regularDimensions = calculateRegularContainerDimensions(
          storyFormat,
          storyDeviceFrame
        )
        regularContainer.style.cssText = `
          width: ${regularDimensions.width}px;
          height: ${regularDimensions.height}px;
          margin: 20px auto;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
        `

        // Render the story in the regular container first
        fetchAndRenderStory(storyId, apiBaseUrl, regularContainer, false, false)

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
          overflow: hidden;
          width: ${dimensions.width}px;
          height: ${dimensions.height}px;
        `

        // Create inner container for the story
        var storyContainer = document.createElement('div')
        storyContainer.style.cssText = `
          width: 100%;
          height: 100%;
          position: relative;
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
            (window.scrollY /
              (document.body.scrollHeight - window.innerHeight)) *
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

        // Fetch and render story into the story container
        fetchAndRenderStory(storyId, apiBaseUrl, storyContainer, false, true)

        // Start scroll detection
        window.addEventListener('scroll', checkScroll)
        window.addEventListener('resize', checkScroll)

        // Initial check
        checkScroll()
      })
      .catch(function (error) {
        console.error('Failed to load story for floater:', error)
      })
  }

  function fetchAndRenderStory(
    storyId,
    apiBaseUrl,
    container,
    autoplay,
    isFloater
  ) {
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

        // Get container dimensions
        var width = container.style.width || container.offsetWidth || 360
        var height = container.style.height || container.offsetHeight || 700

        // Calculate frame styling based on story's format and device frame
        var frameStyle = getFrameStyle(story.format, story.deviceFrame)
        console.log('Frame style calculated:', frameStyle)

        var iframe = document.createElement('iframe')
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.border = frameStyle.border
        iframe.style.borderRadius = frameStyle.borderRadius
        iframe.style.background = frameStyle.background
        iframe.style.boxShadow = frameStyle.boxShadow
        iframe.style.display = 'block'
        iframe.style.margin = isFloater ? '0' : '0 auto'
        var slideDuration = 2500

        // Build the story UI
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

            // Frame Link Indicators and Click Handler for ad frames
            var adLinkIndicators = ''
            var adLinkClickHandler = ''
            if (frame.link) {
              // Link indicator badge for ad frames
              adLinkIndicators =
                '<div style="position:absolute;right:12px;top:64px;z-index:50;"><div style="display:flex;align-items:center;gap:4px;border-radius:999px;background:rgba(59,130,246,0.9);backdrop-filter:blur(4px);padding:4px 8px;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span style="font-size:10px;font-weight:600;">Link</span></div></div>'

              // Click to open hint for ad frames
              adLinkIndicators +=
                '<div style="position:absolute;bottom:12px;right:12px;z-index:50;"><div style="border-radius:999px;background:rgba(255,255,255,0.2);backdrop-filter:blur(4px);padding:4px 8px;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);"><span style="font-size:10px;font-weight:600;">Click to open</span></div></div>'

              // Add click handler for the entire ad slide
              adLinkClickHandler =
                'onclick="event.stopPropagation();handleFrameLink(\'' +
                frame.link +
                '\')" style="cursor:pointer;"'
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
              adLinkIndicators +
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
          var elementsHtml = (frame.elements || [])
            .map(function (el) {
              var style =
                'position:absolute;left:' +
                el.x +
                'px;top:' +
                el.y +
                'px;width:' +
                el.width +
                'px;height:' +
                el.height +
                'px;'
              if (el.type === 'text') {
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
                  ';display:flex;align-items:center;justify-content:center;text-align:center;padding:2px;'
                return (
                  '<div style="' + style + '">' + (el.content || '') + '</div>'
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
              (story.publisherName || '') +
              '</div><div style="color:#fff;opacity:0.8;font-size:12px;">' +
              (story.storyTitle || '') +
              '</div></div>' +
              '<div style="color:#fff;font-size:12px;">' +
              (idx + 1) +
              '/' +
              frames.length +
              '</div>' +
              '</div>'
          }

          // CTA
          var cta = ''
          if (story.ctaType) {
            var ctaText = ''
            if (story.ctaType === 'redirect') ctaText = 'Visit Link'
            if (story.ctaType === 'form') ctaText = 'Fill Form'
            if (story.ctaType === 'promo') ctaText = 'Get Promo'
            if (story.ctaType === 'sell') ctaText = 'Buy Now'
            cta =
              '<div id="snappy-cta-btn" style="position:absolute;left:16px;right:16px;bottom:32px;z-index:10;"><div style="border-radius:999px;background:rgba(255,255,255,0.9);padding:12px 24px;text-align:center;backdrop-filter:blur(4px);font-weight:600;color:#111;font-size:15px;cursor:pointer;">' +
              ctaText +
              '</div></div>'
          }

          // Frame Link Indicators and Click Handler
          var linkIndicators = ''
          var linkClickHandler = ''
          if (frame.link) {
            // Link indicator badge
            linkIndicators =
              '<div style="position:absolute;right:12px;top:64px;z-index:50;"><div style="display:flex;align-items:center;gap:4px;border-radius:999px;background:rgba(59,130,246,0.9);backdrop-filter:blur(4px);padding:4px 8px;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span style="font-size:10px;font-weight:600;">Link</span></div></div>'

            // Click to open hint
            linkIndicators +=
              '<div style="position:absolute;bottom:12px;right:12px;z-index:50;"><div style="border-radius:999px;background:rgba(255,255,255,0.2);backdrop-filter:blur(4px);padding:4px 8px;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);"><span style="font-size:10px;font-weight:600;">Click to open</span></div></div>'

            // Add click handler for the entire slide
            linkClickHandler =
              'onclick="event.stopPropagation();handleFrameLink(\'' +
              frame.link +
              '\')" style="cursor:pointer;"'
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
            '<div style="position:relative;width:100%;height:100%;">' +
            elementsHtml +
            '</div>' +
            cta +
            linkIndicators +
            '</div>'
          )
        })

        var html =
          `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
          html,body{margin:0;padding:0;overflow:hidden;background:#111;width:100vw;height:100vh;}
          body{width:100vw;height:100vh;}
          .slide{transition:opacity 0.3s;opacity:0;pointer-events:none;width:100%;height:100%;}
          .slide.active{opacity:1;pointer-events:auto;z-index:1;}
          .slide.has-link{pointer-events:auto;cursor:pointer;z-index:100;}
          .nav-btn{display:none;}
          .nav-area{position:absolute;top:0;bottom:0;width:50%;z-index:50;}
          .nav-area.left{left:0;}
          .nav-area.right{right:0;}
          #snappy-cta-btn > div { cursor: pointer; }
          .ad-frame { background: #000; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        </style><script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script></head><body><div style="width:100vw;height:100vh;position:relative;margin:0 auto;background:#111;border-radius:` +
          frameStyle.innerBorderRadius +
          `;overflow:hidden;">
        ${slides.join('')}
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
        
        var slides=document.querySelectorAll('.slide');var idx=0;var interval=null;var story=${JSON.stringify(story)};var frames=${JSON.stringify(frames)};function animateProgressBar(i){var bars=document.querySelectorAll('.progress-bar');bars.forEach(function(bar,bidx){bar.style.transition='none';if(bidx<i){bar.style.width='100%';bar.style.transition='width 0.3s';}else if(bidx===i){bar.style.width='0%';setTimeout(function(){bar.style.transition='width '+${slideDuration}+'ms linear';bar.style.width='100%';},0);}else{bar.style.width='0%';}});}function show(i){slides.forEach(function(s,j){s.classList.toggle('active',j===i);});animateProgressBar(i);attachCTAHandler();}function next(){if(idx<slides.length-1){idx++;show(idx);if(${autoplay}){resetAutoplay();}}}function prev(){if(idx>0){idx--;show(idx);if(${autoplay}){resetAutoplay();}}}document.getElementById('navLeft').onclick=prev;document.getElementById('navRight').onclick=next;function resetAutoplay(){if(interval){clearTimeout(interval);}animateProgressBar(idx);interval=setTimeout(function(){if(idx<slides.length-1){idx++;show(idx);resetAutoplay();}},${slideDuration});}function attachCTAHandler(){var cta=document.getElementById('snappy-cta-btn');if(cta){cta.onclick=function(e){e.stopPropagation();if(story.ctaType==='redirect'&&story.ctaValue){window.open(story.ctaValue,'_blank');}else{alert('CTA clicked: '+(story.ctaType||''));}};}}function handleFrameLink(url){if(url){window.open(url,'_blank','noopener,noreferrer');}}show(idx);if(${autoplay}){resetAutoplay();}
        </script></body></html>`

        iframe.srcdoc = html
        container.innerHTML = ''
        container.appendChild(iframe)
      })
      .catch(function (error) {
        console.error('Failed to load story:', error)
        container.innerHTML =
          '<div style="padding:20px;text-align:center;color:#666;background:white;border-radius:12px;">Story not found or failed to load<br><small>' +
          error.message +
          '</small></div>'
      })
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
        baseDimensions = { width: 280, height: 490 }
      } else {
        // Video player portrait
        baseDimensions = { width: 320, height: 180 }
      }
    } else {
      // Landscape format
      if (deviceFrame === 'mobile') {
        baseDimensions = { width: 360, height: 200 }
      } else {
        // Video player landscape
        baseDimensions = { width: 480, height: 270 }
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
