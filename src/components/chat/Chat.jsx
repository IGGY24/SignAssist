import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
//import upload from "../../lib/upload";
import { format } from "timeago.js";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const [audio, setAudio] = useState({ file: null, url: "" });
  const [islVideo, setIslVideo] = useState({ file: null, url: "" });
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null); // For speech recognition

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  // const startRecording = async () => {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     mediaRecorderRef.current = new MediaRecorder(stream);
  //     audioChunksRef.current = [];

  //     mediaRecorderRef.current.ondataavailable = (event) => {
  //       if (event.data.size > 0) {
  //         audioChunksRef.current.push(event.data);
  //       }
  //     };

  //     mediaRecorderRef.current.onstop = () => {
  //       const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
  //       const audioUrl = URL.createObjectURL(audioBlob);

  //       setAudio({ file: audioBlob, url: audioUrl });
  //       convertSpeechToText(audioBlob);
  //     };

  //     mediaRecorderRef.current.start();
  //     setIsRecording(true);
  //   } catch (err) {
  //     console.error("Error accessing microphone:", err);
  //   }
  // };


  const startRecording = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US"; // Set language
    recognition.interimResults = false; // Get full results
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript; // Get converted text
      setText(speechText);
      convertTextToISL(speechText); // Trigger ISL conversion
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const convertSpeechToText = (audioBlob) => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error("Speech Recognition not supported in this browser.");
      return;
    }

    recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognitionRef.current.lang = "en-IN";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = async (event) => {
      const speechText = event.results[0][0].transcript;
      setText(speechText);
      convertTextToISL(speechText);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
    };

    recognitionRef.current.start();
  };


  const handleSend = async () => {
    if (text === "" && !audio.file && !islVideo.url) return;

    try {
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(img.file && { img: img.url }),
          ...(audio.file && { audio: audio.url }),
          ...(islVideo.url && { islVideo: islVideo.url }),
        }),
      });
    } catch (err) {
      console.log(err);
    } finally {
      setImg({ file: null, url: "" });
      setAudio({ file: null, url: "" });
      setIslVideo({ file: null, url: "" });
      setText("");
    }
  };

  // const handleSend = async () => {
  //   if (text === "") return;

  //   let imgUrl = null;

  //   try {
  //     // if (img.file) {
  //     //   imgUrl = await upload(img.file);
  //     // }

  //     await updateDoc(doc(db, "chats", chatId), {
  //       messages: arrayUnion({
  //         senderId: currentUser.id,
  //         text,
  //         createdAt: new Date(),
  //         ...(imgUrl && { img: imgUrl }),
  //       }),
  //     });

    //   const userIDs = [currentUser.id, user.id];

    //   userIDs.forEach(async (id) => {
    //     const userChatsRef = doc(db, "userchats", id);
    //     const userChatsSnapshot = await getDoc(userChatsRef);

    //     if (userChatsSnapshot.exists()) {
    //       const userChatsData = userChatsSnapshot.data();

    //       const chatIndex = userChatsData.chats.findIndex(
    //         (c) => c.chatId === chatId
    //       );

    //       userChatsData.chats[chatIndex].lastMessage = text;
    //       userChatsData.chats[chatIndex].isSeen =
    //         id === currentUser.id ? true : false;
    //       userChatsData.chats[chatIndex].updatedAt = Date.now();

    //       await updateDoc(userChatsRef, {
    //         chats: userChatsData.chats,
    //       });
    //     }
    //   });
    // } catch (err) {
    //   console.log(err);
    // } finally{
    // setImg({
    //   file: null,
    //   url: "",
    // });

  //   setText("");
  //   }
  // };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Lorem ipsum dolor, sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={message?.createAt}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              {message.audio && <audio controls src={message.audio}></audio>}
              {message.islVideo && <video controls src={message.islVideo}></video>}
              <p>{message.text}</p>
              <span>{format(message.createdAt.toDate())}</span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        {islVideo.url && (
          <div className="message own">
            <div className="texts">
              <video controls src={islVideo.url}></video>
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          {/* <button onClick={isRecording ? stopRecording : startRecording}>
            <img src={isRecording ? "./mic.png" : "./micstop.png"} alt="Mic" />
          </button> */}

          <button onClick={startRecording} className="bg-blue-500 text-white p-2 mt-3 rounded">
              {isRecording ? "Recording..." : "Record Voice"}
          </button>

        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
