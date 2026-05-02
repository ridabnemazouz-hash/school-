import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff,
  MessageSquare, Users, Plus, X, Send, Copy, Play, StopCircle,
  Hand, Hash, Clock, Search, Loader2, Check, Wifi, WifiOff
} from 'lucide-react';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function VideoRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [form, setForm] = useState({ title: '', description: '', subject: '', max_participants: 30 });
  const [search, setSearch] = useState('');

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/rooms/`, { credentials: 'include' });
      if (res.ok) setRooms(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/rooms/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: '', description: '', subject: '', max_participants: 30 });
        fetchRooms();
      }
    } catch (err) { console.error(err); }
  };

  const handleStart = async (id) => {
    try {
      const res = await fetch(`${API}/rooms/${id}/start`, {
        method: 'POST', credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        enterRoom(id, data.room_code);
      }
    } catch (err) { console.error(err); }
  };

  const handleEnd = async (id) => {
    try {
      const res = await fetch(`${API}/rooms/${id}/end`, {
        method: 'POST', credentials: 'include'
      });
      if (res.ok) {
        setActiveRoom(null);
        fetchRooms();
      }
    } catch (err) { console.error(err); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await fetch(`${API}/rooms/join-by-code?room_code=${encodeURIComponent(joinCode.trim())}`, {
        method: 'POST', credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        enterRoom(data.room.id, data.room.room_code);
        setShowJoin(false);
        setJoinCode('');
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to join');
      }
    } catch (err) { console.error(err); }
  };

  const enterRoom = (roomId, roomCode) => {
    setActiveRoom({ id: roomId, code: roomCode });
  };

  const filtered = rooms.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    r.room_code.toLowerCase().includes(search.toLowerCase())
  );

  if (activeRoom) {
    return (
      <VideoRoomView
        room={activeRoom}
        onLeave={() => { setActiveRoom(null); fetchRooms(); }}
        onEnd={() => { handleEnd(activeRoom.id); }}
        user={user}
      />
    );
  }

  const canCreate = user.role === 'Teacher' || user.role === 'Admin' || user.role === 'Super Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Video Rooms</h1>
          <p className="text-slate-500 mt-1">Virtual classrooms for live sessions between teachers and students.</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus size={18} className="mr-2" /> Create Room
            </Button>
          )}
          <Button onClick={() => setShowJoin(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Video size={18} className="mr-2" /> Join Room
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Rooms</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{rooms.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{rooms.filter(r => r.status === 'active').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Scheduled</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{rooms.filter(r => r.status === 'scheduled').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{rooms.filter(r => r.status === 'ended').length}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text" placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Rooms List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-10"><Loader2 size={32} className="animate-spin text-slate-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-400">No rooms found.</div>
        ) : (
          filtered.map(room => (
            <Card key={room.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{room.title}</h3>
                      <StatusBadge status={room.status} />
                    </div>
                    {room.subject && (
                      <p className="text-xs text-indigo-600 font-semibold mt-1">{room.subject}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">by {room.teacher_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Hash size={12} />
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{room.room_code}</span>
                    </div>
                  </div>
                </div>

                {room.description && (
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2">{room.description}</p>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{room.participant_count || 0}/{room.max_participants}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{new Date(room.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  {room.status === 'scheduled' && (user.id === room.teacher_id || user.role === 'Admin' || user.role === 'Super Admin') && (
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStart(room.id)}>
                      <Play size={14} className="mr-1" /> Start
                    </Button>
                  )}
                  {room.status === 'active' && (
                    <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => enterRoom(room.id, room.room_code)}>
                      <Video size={14} className="mr-1" /> Join
                    </Button>
                  )}
                  {room.status === 'active' && (user.id === room.teacher_id || user.role === 'Admin' || user.role === 'Super Admin') && (
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleEnd(room.id)}>
                      <StopCircle size={14} className="mr-1" /> End
                    </Button>
                  )}
                  {(user.role === 'Admin' || user.role === 'Super Admin') && (
                    <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => copyCode(room.room_code)}>
                      <Copy size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Video Room">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Title *</label>
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Math Review Session"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
            <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Mathematics"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Session details..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Max Participants</label>
            <input type="number" min={2} max={100} value={form.max_participants} onChange={e => setForm({...form, max_participants: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Join Modal */}
      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Join Video Room">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Room Code</label>
            <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-center text-lg tracking-widest"
              placeholder="XXXX-XXXX"
              maxLength={8}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={() => setShowJoin(false)}>Cancel</Button>
            <Button type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleJoin} disabled={!joinCode.trim()}>
              <Video size={16} className="mr-1" /> Join
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-100 text-emerald-700',
    scheduled: 'bg-amber-100 text-amber-700',
    ended: 'bg-slate-100 text-slate-600'
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[status] || ''}`}>{status}</span>;
}

function VideoRoomView({ room, onLeave, onEnd, user }) {
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const localVideoRef = useRef(null);
  const peerConnections = useRef({});
  const remoteStreams = useRef({});
  const chatRef = useRef(null);

  // Initialize media and WebSocket
  useEffect(() => {
    initRoom();
    return () => cleanup();
  }, []);

  const initRoom = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Media error:', err);
      alert('Camera/Microphone access denied');
    }

    const wsUrl = `${API.replace('http', 'ws')}/rooms/ws/${room.code}/${user.id}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWsMessage(data);
    };

    ws.onclose = () => {
      setConnected(false);
      cleanupPeers();
    };
  };

  const handleWsMessage = async (data) => {
    switch (data.type) {
      case 'joined':
        setParticipants(data.participants);
        // Start creating peer connections for existing participants
        for (const p of data.participants) {
          if (p.user_id !== user.id) {
            await createPeerConnection(p.user_id);
          }
        }
        break;

      case 'participant_joined':
        setParticipants(prev => [...prev, data.participant]);
        if (data.participant.user_id !== user.id) {
          await createPeerConnection(data.participant.user_id);
        }
        break;

      case 'participant_left':
        setParticipants(prev => prev.filter(p => p.user_id !== data.user_id));
        cleanupPeer(data.user_id);
        break;

      case 'offer':
        await handleOffer(data.sender_id, data.offer);
        break;

      case 'answer':
        await handleAnswer(data.sender_id, data.answer);
        break;

      case 'ice_candidate':
        await handleIceCandidate(data.sender_id, data.candidate);
        break;

      case 'chat_message':
        setChatMessages(prev => [...prev, data]);
        break;

      case 'room_ended':
        alert('Room has been ended by the teacher');
        onLeave();
        break;
    }
  };

  const createPeerConnection = async (targetId) => {
    if (peerConnections.current[targetId]) return;

    const pc = new RTCPeerConnection(STUN_SERVERS);

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreams.current[targetId] = remoteStream;
      // The RemoteVideo component will handle this
      updateRemoteStream(targetId, remoteStream);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          target: targetId,
          candidate: event.candidate
        }));
      }
    };

    peerConnections.current[targetId] = pc;

    // Create and send offer (only the first user does this)
    const participantIds = participants.map(p => p.user_id).filter(id => id !== user.id);
    if (participantIds.length === 0 || participantIds.every(id => id >= targetId)) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          target: targetId,
          offer: pc.localDescription
        }));
      }
    }
  };

  const handleOffer = async (senderId, offer) => {
    let pc = peerConnections.current[senderId];
    if (!pc) {
      pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnections.current[senderId] = pc;

      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        remoteStreams.current[senderId] = remoteStream;
        updateRemoteStream(senderId, remoteStream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            target: senderId,
            candidate: event.candidate
          }));
        }
      };
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        target: senderId,
        answer: pc.localDescription
      }));
    }
  };

  const handleAnswer = async (senderId, answer) => {
    const pc = peerConnections.current[senderId];
    if (pc && pc.signalingState !== 'stable') {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (senderId, candidate) => {
    const pc = peerConnections.current[senderId];
    if (pc && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const updateRemoteStream = (userId, stream) => {
    const videoEl = document.getElementById(`remote-video-${userId}`);
    if (videoEl) videoEl.srcObject = stream;
  };

  const cleanupPeer = (userId) => {
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
    delete remoteStreams.current[userId];
  };

  const cleanupPeers = () => {
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    remoteStreams.current = {};
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    cleanupPeers();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = muted);
      setMuted(!muted);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: muted ? 'unmute_audio' : 'mute_audio'
        }));
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = videoOff);
      setVideoOff(!videoOff);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: videoOff ? 'unmute_video' : 'mute_video'
        }));
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const localVideoTrack = localStream.getVideoTracks()[0];
          localStream.replaceTrack(localVideoTrack, videoTrack, localStream);
          videoTrack.onended = () => {
            if (localStream) {
              navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                localStream.getVideoTracks().forEach(t => localStream.removeTrack(t));
                stream.getVideoTracks().forEach(t => localStream.addTrack(t));
              });
            }
            setScreenSharing(false);
          };
        }
        setScreenSharing(true);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'screen_share_start' }));
        }
      } catch (err) { console.error(err); }
    } else {
      setScreenSharing(false);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'screen_share_stop' }));
      }
    }
  };

  const toggleHand = () => {
    setHandRaised(!handRaised);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: handRaised ? 'lower_hand' : 'raise_hand'
      }));
    }
  };

  const sendChat = () => {
    if (!chatInput.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: chatInput
    }));
    setChatInput('');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    alert('Room code copied!');
  };

  const remoteParticipants = participants.filter(p => p.user_id !== user.id);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-900">
      {/* Top Bar */}
      <div className="h-14 bg-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <h2 className="text-white font-semibold">{room.title}</h2>
          <button onClick={copyRoomCode} className="text-xs text-slate-400 hover:text-white font-mono bg-slate-700 px-2 py-0.5 rounded">
            {room.code}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowParticipants(!showParticipants)}
            className={`p-2 rounded-lg transition-colors ${showParticipants ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
            <Users size={18} />
          </button>
          <button onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors relative ${showChat ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
            <MessageSquare size={18} />
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-slate-800 rounded-xl overflow-hidden">
              <video ref={localVideoRef} autoPlay muted playsInline
                className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded-lg">{user.name} (You)</span>
                {handRaised && <Hand size={16} className="text-amber-400" />}
              </div>
              {videoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {remoteParticipants.map(p => (
              <div key={p.user_id} className="relative bg-slate-800 rounded-xl overflow-hidden">
                <video id={`remote-video-${p.user_id}`} autoPlay playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => {
                    const stream = remoteStreams.current[p.user_id];
                    if (stream && e.target.srcObject !== stream) e.target.srcObject = stream;
                  }} />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded-lg">
                    {p.name} {p.is_teacher && '(Teacher)'}
                  </span>
                </div>
              </div>
            ))}

            {remoteParticipants.length === 0 && (
              <div className="col-span-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Waiting for participants...</p>
                  <p className="text-sm mt-1">Share room code: <span className="font-mono bg-slate-800 px-2 py-1 rounded">{room.code}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={chatRef}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.user_id === user.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'}`}>
                    {msg.user_id !== user.id && <p className="text-xs text-indigo-300 font-semibold mb-0.5">{msg.name}</p>}
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-700">
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  className="flex-1 bg-slate-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type a message..."
                />
                <button onClick={sendChat} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Participants ({participants.length})</h3>
              <button onClick={() => setShowParticipants(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {participants.map(p => (
                <div key={p.user_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.role}</p>
                  </div>
                  {p.is_teacher && <Wifi size={14} className="text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="h-16 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-3 px-4">
        <button onClick={toggleMute}
          className={`p-3 rounded-full transition-colors ${muted ? 'bg-red-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${videoOff ? 'bg-red-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
          {videoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
        <button onClick={toggleScreenShare}
          className={`p-3 rounded-full transition-colors ${screenSharing ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
          {screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>
        <button onClick={toggleHand}
          className={`p-3 rounded-full transition-colors ${handRaised ? 'bg-amber-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
          <Hand size={20} />
        </button>
        <button onClick={onLeave}
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 ml-4">
          <PhoneOff size={20} />
        </button>
        {(user.role === 'Teacher' || user.role === 'Admin' || user.role === 'Super Admin') && (
          <button onClick={onEnd}
            className="p-3 rounded-full bg-slate-600 text-white hover:bg-red-600 ml-2">
            <StopCircle size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
