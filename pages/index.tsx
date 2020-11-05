import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { NextPage } from 'next'
import { MutableRefObject, useRef, useEffect, useState } from 'react'
import Hls from 'hls.js'
import * as core from 'p2p-media-loader-core'
import {Engine, initHlsJsPlayer} from 'p2p-media-loader-hlsjs'

interface Props {

}

const VIDEO_URL: string = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
const swarmId: string = "techcast-swarm-test1-eiei"

const Home: NextPage<Props> = () => {

  const videoRef: MutableRefObject<HTMLVideoElement> = useRef(null)
  const hlsRef: MutableRefObject<Hls> = useRef(null)
  const engineRef: MutableRefObject<Engine> = useRef(null)
  const [isSupport, setIsSupport] = useState<boolean>(true)
  const [isP2PSupport, setIsP2PSupport] = useState<boolean>(true)

  useEffect(() => {
    const config = {
      segments: {
          swarmId: swarmId
      },
      loader: {
        trackerAnnounce: [
          // wss tracker other url not working !
          "wss://tracker.openwebtorrent.com"
        ]
      }
    }
    // var Hls = window.Hls
    var engine: Engine = new Engine(config)
    var hls: Hls = new Hls({
      liveSyncDurationCount: 7,
      loader: engine.createLoaderClass(),
      enableWorker: false
    })
    engineRef.current = engine
    hlsRef.current = hls

    setIsSupport(Hls.isSupported())
    setIsP2PSupport(core.HybridLoader.isSupported())
  }, [])

  useEffect(() => {
    if (isSupport && hlsRef.current) {
      const video: HTMLVideoElement = videoRef.current
      if (!video) return

      // var Hls = window.Hls
      const hls = hlsRef.current
      initHlsJsPlayer(hls)

      hls.loadSource(VIDEO_URL);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        video.play();
      });
    }

    if (isP2PSupport) {
      const engine: Engine = engineRef.current
      engine.on(core.Events.PieceBytesDownloaded, (method, size) => {
        console.log("download", {method: method, size: size, timestamp: performance.now()});
        
      })

      engine.on(core.Events.PieceBytesUploaded, (method, size) => {
        console.log("upload", {size: size, timestamp: performance.now()});
      })

      engine.on(core.Events.PeerConnect, (peer) => {
        console.log("peer connect", peer);
      });

      engine.on(core.Events.PeerClose, (peer) => {
        console.log("peer disconnect", peer);
      });
    }
  }, [isSupport])

  const openNewTab = () => {
    window.open("/", "_blank")
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>P2P CDN video stream</title>
        <link rel="icon" href="/favicon.ico" />
        {/* <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <script src="https://www.jsdelivr.com/package/npm/p2p-media-loader-core"></script>
        <script src="https://www.jsdelivr.com/package/npm/p2p-media-loader-hlsjs"></script> */}
      </Head>
      
      {
        isSupport ?
          <div>
            <video style={{width:"600px"}} ref={videoRef} controls />
            <button onClick={openNewTab}> new peer </button>
          </div>
        :
          null  
      }

    </div>
  )
}

export default Home