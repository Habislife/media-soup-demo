const io = require('socket.io-client')
const mediasoupCilent = require('mediasoup-client')
const socket = io("/mediasoup")

socket.on('connection-success', ({ socketId }) => {
    console.log(socketId)
})

let device
let params ={}

const streamSuccess = async (stream) => {
    localVideo.srcObject = stream
    const track = stream.getVideoTracks()[0]
    params = {
      track,
      ...params
    }
  }
  const getLocalStream = () => {
    navigator.getUserMedia({
      audio: false,
      video: {
        width: {
          min: 640,
          max: 1920,
        },
        height: {
          min: 400,
          max: 1080,
        }
      }
    }, streamSuccess, error => {
      console.log(error.message)
    })
  }

const createDevice = async () =>{
  try{
    device = new mediasoupCilent.Device()
    await device.load({
      routerRtpCapabilities: rtpCapabilities
    })
  }catch (error){
    console.log(error)
    if (error.name === 'UnsupportedError')
      console.warn('browser not supported')
  }
}
const getRtpCapabilities = () => {
  socket.emit('getRtpCapabilities'),(rtpCapabilities)=>{
    console.log(`Router Rtp Capabilities.... ${rtpCapabilities}`)
  }
}

btnLocalVideo.addEventListener('click', getLocalStream)
btnRtpCapabilities.addEventListener('click', getRtpCapabilities)
// btnDevice.addEventListener('click', createDevice)
// btnCreateSendTransport.addEventListener('click', createSendTransport)
// btnConnectSendTransport.addEventListener('click', connectSendTransport)
// btnRecvSendTransport.addEventListener('click', createRecvTransport)
// btnConnectRecvTransport.addEventListener('click', connectRecvTransport)