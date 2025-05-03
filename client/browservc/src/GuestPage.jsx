import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import socket from "./socket";
import "./App.css";

const GuestPage = () => {
  const { roomId } = useParams();
  const peerConnection = useRef();
  const localStreamRef = useRef();
  const adminSocketId = useRef();

  const callAdmin = () => {
    socket.emit("call-admin", roomId);
  };

  const cleanup = () => {
    peerConnection.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnection.current = null;
    localStreamRef.current = null;
  };

  const endCall = () => {
    if (adminSocketId.current) {
      socket.emit("end-call", { target: adminSocketId.current });
    }
    cleanup();
  };

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("offer", async ({ sdp, from }) => {
      adminSocketId.current = from;

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

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer", {
        target: from,
        sdp: answer,
      });
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnection.current.addIceCandidate(candidate);
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    });

    socket.on("call-ended", () => {
      console.log("Call ended by admin");
      cleanup();
    });

    return () => {
      socket.off("offer");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [roomId]);

  return (
    <div className="container">
      <h2>Guest Page - Room: {roomId}</h2>
      <button onClick={callAdmin}>Call Admin</button>
      <button onClick={endCall}>End Call</button>
    </div>
  );
};

export default GuestPage;
