import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import socket from "./socket";
import "./App.css";

const App = () => {
  const [admin, setAdmin] = useState(false);
  const [room, setRoom] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const localStreamRef = useRef();
  const peerConnection = useRef();
  const remoteSocketId = useRef();

  const createLink = async () => {
    const roomId = uuidv4();
    setRoom(roomId);
    setAdmin(true);
    socket.emit("create-room", roomId);
  };

  const setupConnection = async (from) => {
    remoteSocketId.current = from;

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: from,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play();
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) =>
      peerConnection.current.addTrack(track, stream)
    );
    localStreamRef.current = stream;

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", {
      target: from,
      sdp: offer,
    });
  };

  const endCall = () => {
    if (remoteSocketId.current) {
      socket.emit("end-call", { target: remoteSocketId.current });
    }
    cleanup();
  };

  const cleanup = () => {
    peerConnection.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnection.current = null;
    localStreamRef.current = null;
    setIncomingCall(null);
  };

  useEffect(() => {
    socket.on("incoming-call", ({ from }) => {
      setIncomingCall(from);
    });

    socket.on("answer", async ({ sdp }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnection.current.addIceCandidate(candidate);
      } catch (e) {
        console.error("Error adding ICE candidate", e);
      }
    });

    socket.on("call-ended", () => {
      console.log("Call ended by guest");
      cleanup();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, []);

  return (
    <div className="container">
      <h1>Link2Call - Admin</h1>
      {!room ? (
        <button onClick={createLink}>Generate Link</button>
      ) : (
        <div>
          <p>Send this link to Guest:</p>
          <input readOnly value={`${window.location.origin}/join/${room}`} />
        </div>
      )}

      {incomingCall && (
        <div>
          <p>Incoming call from guest</p>
          <button onClick={() => setupConnection(incomingCall)}>Accept</button>
          <button onClick={endCall}>End Call</button>
        </div>
      )}
    </div>
  );
};

export default App;
