import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);
import { useEffect, useRef, useState } from "react";
import { hightlightsSlides } from "../constants";
import { pauseImg, playImg, replayImg } from "../utils";

const VideoCarousel = () => {
  // Using refs to store DOM elements for videos, spans (progress bars), and divs (containers for progress bars).
  const videoRef = useRef([]); // Ref for video elements to manage playback.
  const videoSpanRef = useRef([]); // Ref for spans that represent the progress bar of each video.
  const videoDivRef = useRef([]); // Ref for containers that hold the progress bars.

  // Defining the state for video-related properties.
  const [video, setVideo] = useState({
    isEnd: false, // Whether the current video has ended.
    startPlay: false, // Whether the video has started playing.
    videoId: 0, // The current video ID or index in the carousel.
    isLastVideo: false, // Whether the last video in the carousel is playing.
    isPlaying: false, // Whether the video is currently playing or paused.
  });

  // State to store metadata of loaded videos (used to ensure videos are ready for playback).
  const [loadedData, setLoadedData] = useState([]);

  // Destructuring the video state for easier access in the component.
  const { isEnd, isLastVideo, startPlay, videoId, isPlaying } = video;

  // Setting up GSAP animation for the video slider.
  useGSAP(() => {
    // Animating the video slider to move left or right based on the current video ID.
    gsap.to('#slider', {
      transform: `translateX(${-100 * videoId}%)`, // Slide the container based on the current video index.
      duration: 2, // Duration of the animation in seconds.
      ease: 'power2.inOut', // Easing function for smooth sliding effect.
    });

    // Animating the video element itself.
    gsap.to('#video', {
      scrollTrigger: {
        trigger: '#video', // The animation is triggered when the video element comes into view during scroll.
        toggleActions: 'restart none none none', // The video restarts when the user scrolls back.
      },
      onComplete: () => {
        // Once the animation completes, set the video state to playing.
        setVideo((prevVideo) => ({
          ...prevVideo,
          startPlay: true, // Start the video playback.
          isPlaying: true, // Set the playing state to true.
        }));
      },
    });
  }, [isEnd, videoId]); // The animation depends on whether the video ended or the video ID changed.

  // Effect to handle the video play/pause logic based on user interaction or video state.
  useEffect(() => {
    if (loadedData.length > 3) { // Ensure the metadata of all videos is loaded before proceeding.
      if (!isPlaying) {
        videoRef.current[videoId].pause(); // Pause the video if `isPlaying` is false.
      } else {
        startPlay && videoRef.current[videoId].play(); // Play the video if `isPlaying` is true and it is marked to start.
      }
    }
  }, [startPlay, videoId, isPlaying, loadedData]); // This effect depends on the play state, current video, and loaded video data.

  // Function to store video metadata (such as duration) when a video loads.
  const handleLoadedMetadata = (i, e) => setLoadedData((prevVideo) => [...prevVideo, e]);

  // Effect to animate and update the progress bar of the current video.
  useEffect(() => {
    let currentProgress = 0; // Keep track of the current progress percentage.
    let span = videoSpanRef.current; // Reference to the span element representing the progress bar.

    if (span[videoId]) { // Check if the span for the current video exists.
      let anim = gsap.to(span[videoId], {
        onUpdate: () => {
          const progress = Math.ceil(anim.progress() * 100); // Calculate the progress percentage.

          if (progress != currentProgress) { // Update the progress only if it changes.
            currentProgress = progress;

            // Adjust the width of the progress bar container based on screen size.
            gsap.to(videoDivRef.current[videoId], {
              width: window.innerWidth < 760
                ? '10vw' // Set width for small screens.
                : window.innerWidth < 1200
                ? '10vw' // Set width for medium screens.
                : '4vw', // Set width for large screens.
            });

            // Update the progress bar width and color dynamically.
            gsap.to(span[videoId], {
              width: `${currentProgress}%`, // Set the width of the progress bar based on progress percentage.
              backgroundColor: 'white', // Set the background color to white.
            });
          }
        },
        onComplete: () => {
          if (isPlaying) { // When the video completes playing.
            // Reset the progress bar container width.
            gsap.to(videoDivRef.current[videoId], {
              width: '12px',
            });
            // Set the progress bar color to a grayish color after completion.
            gsap.to(span[videoId], {
              background: '#afafaf',
            });
          }
        },
      });

      if (videoId === 0) {
        anim.restart(); // Restart the animation if it's the first video.
      }

      // Function to update the progress of the animation based on the video's current time.
      const animUpdate = () => {
        anim.progress(videoRef.current[videoId].currentTime / hightlightsSlides[videoId].videoDuration); // Update animation based on the video playback progress.
      };

      if (isPlaying) {
        gsap.ticker.add(animUpdate); // Add the progress update function to GSAP's ticker (runs at every frame).
      } else {
        gsap.ticker.remove(animUpdate); // Remove the update when the video is paused or stopped.
      }
    }
  }, [videoId, startPlay]); // This effect depends on the video ID and whether the video started playing.

  // Function to handle different events in the video (end, last video, reset, play, pause).
  const handleProcess = (type, i) => {
    switch (type) {
      case 'video-end':
        setVideo((prevVideo) => ({ ...prevVideo, isEnd: true, videoId: i + 1 })); // Move to the next video when the current video ends.
        break;
      case 'video-last':
        setVideo((prevVideo) => ({ ...prevVideo, isLastVideo: true })); // Set the flag to indicate the last video has finished.
        break;
      case 'video-reset':
        setVideo((prevVideo) => ({ ...prevVideo, isLastVideo: false, videoId: 0 })); // Reset the video carousel to the first video.
        break;
      case 'play':
        setVideo((prevVideo) => ({ ...prevVideo, isPlaying: !prevVideo.isPlaying })); // Toggle play/pause state.
        break;
      case 'pause':
        setVideo((prevVideo) => ({ ...prevVideo, isPlaying: !prevVideo.isPlaying })); // Toggle pause/play state.
        break;
      default:
        return video; // Default case does nothing, just returns the current state.
    }
  };

  // JSX to render the video carousel and controls.
  return (
    <>
      <div className="flex items-center">
        {hightlightsSlides.map((list, i) => (
          <div key={list.id} id="slider" className="sm:pr-20 pr-10">
            <div className="video-carousel_container">
              <div className="w-full h-full flex-center rounded-3xl overflow-hidden bg-black">
                <video
                  id="video"
                  playsInline={true} // Enables video to play inline (not in fullscreen) on mobile devices.
                  preload="auto" // Preload the video metadata before playing.
                  muted // Mute the video by default.
                  className={`${list.id === 2 && 'translate-x-44'} pointer-events-none`} // Add special class for specific video and disable interaction.
                  ref={(el) => (videoRef.current[i] = el)} // Store the video element in the videoRef array.
                  onEnded={() =>
                    i !== 3 ? handleProcess('video-end', i) : handleProcess('video-last') // Handle video end or last video event.
                  }
                  onPlay={() => {
                    setVideo((prevVideo) => ({
                      ...prevVideo,
                      isPlaying: true, // Set video to playing state on play event.
                    }));
                  }}
                  onLoadedMetadata={(e) => handleLoadedMetadata(i, e)} // Store video metadata when loaded.
                >
                  <source src={list.video} type="video/mp4" /> // Set the video source and type.
                </video>
              </div>
              {/* // Render each text for the current video. */}
              <div className="absolute top-12 left-[5%] z-10">
                {list.textLists.map((text) => (
                  <p key={text} className="md:text-2xl text-xl font-medium">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="relative flex-center mt-10">
        <div className="flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full">
          {videoRef.current.map((_, i) => (
            <span
              key={i}
              className="mx-2 w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer"
              ref={(el) => (videoDivRef.current[i] = el)} // Store the container div reference for progress bars.
            >
              <span
                className="absolute h-full w-full rounded-full"
                ref={(el) => (videoSpanRef.current[i] = el)} // Store the span reference for progress bars.
              />
            </span>
          ))}
        </div>
        <button className="control-btn">
          <img
            src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg} // Set the control button image based on video state.
            alt={isLastVideo ? 'replay' : !isPlaying ? 'play' : 'pause'} // Set alt text for the control button.
            onClick={
              isLastVideo
                ? () => handleProcess('video-reset') // Handle replay action if the last video finished.
                : !isPlaying
                ? () => handleProcess('play') // Handle play action if video is paused.
                : () => handleProcess('pause') // Handle pause action if video is playing.
            }
          />
        </button>
      </div>
    </>
  );
};

export default VideoCarousel; // Export the VideoCarousel component.
