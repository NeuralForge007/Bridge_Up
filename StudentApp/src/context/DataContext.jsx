import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const DataContext = createContext();

// Pre-seeded Peers Fallback
const INITIAL_PEERS = [
  {
    id: 'peer-1',
    name: 'David Kim',
    email: 'david.kim@university.edu',
    major: 'Computer Science',
    year: 'Senior',
    gpa: '3.95',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    bio: 'Competitive programmer & algorithm enthusiast. TA for CS301. Hit me up for LeetCode practice or system design!',
    skills: ['C++', 'Python', 'Algorithms', 'System Design', 'React'],
    courses: ['CS301 Data Structures', 'CS420 Artificial Intelligence'],
    status: 'online',
    matchScore: 98,
    connectionState: 'connected'
  },
  {
    id: 'peer-2',
    name: 'Elena Rostova',
    email: 'elena.r@university.edu',
    major: 'Data Science',
    year: 'Junior',
    gpa: '3.91',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    bio: 'NLP research assistant. Passionate about LLMs and Data Mining. Looking for a study buddy for Machine Learning.',
    skills: ['PyTorch', 'Python', 'NLP', 'SQL', 'Data Pipelines'],
    courses: ['DS310 Machine Learning', 'CS420 Artificial Intelligence'],
    status: 'studying',
    matchScore: 95,
    connectionState: 'connected'
  },
  {
    id: 'peer-3',
    name: 'Lucas Thorne',
    email: 'lucas.t@university.edu',
    major: 'Electrical Engineering',
    year: 'Senior',
    gpa: '3.82',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
    bio: 'Hardware hacker & embedded systems fan. Working on microcontrollers and IoT projects.',
    skills: ['Arduino', 'C++', 'Circuit Design', 'Verilog', 'MATLAB'],
    courses: ['EE201 Circuits', 'ME415 Robotics Engineering'],
    status: 'online',
    matchScore: 89,
    connectionState: 'none'
  },
  {
    id: 'peer-4',
    name: 'Maya Patel',
    email: 'maya.p@university.edu',
    major: 'Biomedical Engineering',
    year: 'Sophomore',
    gpa: '3.89',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    bio: 'Cell biology research, lab geek, and organic chem tutor. Happy to help with chemistry or biology homework.',
    skills: ['Genetics', 'Organic Chemistry', 'Bio-Materials', 'R'],
    courses: ['BME201 Bio-Materials', 'CHEM301 Organic Chemistry II'],
    status: 'offline',
    matchScore: 84,
    connectionState: 'pending'
  },
  {
    id: 'peer-5',
    name: 'Julian Vance',
    email: 'julian.v@university.edu',
    major: 'Computer Science',
    year: 'Junior',
    gpa: '3.78',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
    bio: 'Web dev enthusiast & UI designer. Love crafting sleek user interfaces and React applications.',
    skills: ['React', 'TypeScript', 'UI/UX Design', 'Tailwind', 'Node.js'],
    courses: ['CS301 Data Structures', 'CS201 Object Oriented Design'],
    status: 'online',
    matchScore: 92,
    connectionState: 'connected'
  },
  {
    id: 'peer-6',
    name: 'Chloe Zhang',
    email: 'chloe.z@university.edu',
    major: 'Mathematics & Stats',
    year: 'Senior',
    gpa: '3.98',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250',
    bio: 'Math genius! Abstract algebra, differential equations, and probability are my passion.',
    skills: ['Linear Algebra', 'Calculus', 'Probability', 'LaTeX', 'R'],
    courses: ['MATH302 Linear Algebra', 'STAT401 Probability Theory'],
    status: 'studying',
    matchScore: 91,
    connectionState: 'none'
  }
];

// Pre-seeded Study Groups
const INITIAL_STUDY_GROUPS = [
  {
    id: 'sg-1',
    name: 'CS301 Algorithm Knights 🛡️',
    course: 'CS301 Data Structures',
    description: 'Weekly problem solving, graph algorithms, dynamic programming & midterm review squad.',
    membersCount: 14,
    maxMembers: 20,
    leader: 'David Kim',
    meetingTime: 'Tuesdays & Thursdays @ 6:00 PM',
    location: 'Science Library Room 402 / Discord',
    tags: ['LeetCode', 'Trees & Graphs', 'Midterm Prep'],
    isJoined: true
  },
  {
    id: 'sg-2',
    name: 'AI & Machine Learning Lab 🤖',
    course: 'CS420 Artificial Intelligence',
    description: 'Neural networks paper reading, PyTorch projects, and project collaboration.',
    membersCount: 9,
    maxMembers: 15,
    leader: 'Elena Rostova',
    meetingTime: 'Wednesdays @ 5:30 PM',
    location: 'Engineering Hall 204',
    tags: ['PyTorch', 'Deep Learning', 'Paper Discussion'],
    isJoined: true
  },
  {
    id: 'sg-3',
    name: 'Organic Chem Survivors 🧪',
    course: 'CHEM301 Organic Chemistry II',
    description: 'Reaction mechanisms breakdown, flashcard drills, and quiz prep.',
    membersCount: 18,
    maxMembers: 25,
    leader: 'Maya Patel',
    meetingTime: 'Mondays @ 7:00 PM',
    location: 'Chemistry Lab B',
    tags: ['Reactions', 'Flashcards', 'Exam Practice'],
    isJoined: false
  },
  {
    id: 'sg-4',
    name: 'Robotics & Hardware Engineers 🦾',
    course: 'ME415 Robotics Engineering',
    description: 'Hands-on CAD modeling, ROS2 controller programming, and sensor integration.',
    membersCount: 8,
    maxMembers: 12,
    leader: 'Marcus Vance',
    meetingTime: 'Fridays @ 3:00 PM',
    location: 'MakerSpace Lab 1',
    tags: ['CAD', 'ROS2', 'Hardware'],
    isJoined: false
  }
];

// Pre-seeded Assignments
const INITIAL_ASSIGNMENTS = [
  {
    id: 'asg-1',
    title: 'Graph Traversal & Dijkstra Algorithm Implementation',
    course: 'CS301 Data Structures',
    dueDate: '2026-07-28',
    dueTime: '11:59 PM',
    status: 'in_progress',
    priority: 'high',
    weight: '15%',
    score: null,
    notes: 'Implement adjacency list graph with shortest path algorithm and benchmark running time.'
  },
  {
    id: 'asg-2',
    title: 'Convolutional Neural Networks for Image Classification',
    course: 'CS420 Artificial Intelligence',
    dueDate: '2026-07-30',
    dueTime: '5:00 PM',
    status: 'todo',
    priority: 'high',
    weight: '20%',
    score: null,
    notes: 'Train ResNet-18 model on CIFAR-10 dataset using PyTorch with data augmentation.'
  },
  {
    id: 'asg-3',
    title: 'Linear Algebra Matrix Transformations Quiz',
    course: 'MATH302 Linear Algebra',
    dueDate: '2026-07-25',
    dueTime: '2:00 PM',
    status: 'submitted',
    priority: 'medium',
    weight: '10%',
    score: null,
    notes: 'Eigenvalues, eigenvectors, and singular value decomposition problem sets.'
  },
  {
    id: 'asg-4',
    title: 'Distributed Consensus & Raft Protocol Report',
    course: 'CS450 Distributed Systems',
    dueDate: '2026-07-20',
    dueTime: '11:59 PM',
    status: 'graded',
    priority: 'medium',
    weight: '15%',
    score: '96/100 (A)',
    notes: 'Detailed analysis of raft leader election and log replication fault tolerance.'
  }
];

const INITIAL_SCHEDULE = [
  { id: 'sch-1', day: 'Monday', time: '10:00 AM - 11:30 AM', course: 'CS301 Data Structures', room: 'Eng Hall 101', instructor: 'Prof. Harrison' },
  { id: 'sch-2', day: 'Monday', time: '01:30 PM - 03:00 PM', course: 'CS420 Artificial Intelligence', room: 'Turing Lab 304', instructor: 'Dr. Zhang' },
  { id: 'sch-3', day: 'Tuesday', time: '09:00 AM - 10:30 AM', course: 'MATH302 Linear Algebra', room: 'Math Quad 210', instructor: 'Prof. Miller' },
  { id: 'sch-4', day: 'Wednesday', time: '10:00 AM - 11:30 AM', course: 'CS301 Data Structures', room: 'Eng Hall 101', instructor: 'Prof. Harrison' },
  { id: 'sch-5', day: 'Thursday', time: '02:00 PM - 04:30 PM', course: 'CS450 Distributed Systems', room: 'Turing Lab 308', instructor: 'Dr. Al-Mansoor' }
];

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    peerId: 'peer-1',
    peerName: 'David Kim',
    peerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    lastMessage: 'Awesome! Are you coming to the CS301 review session tonight?',
    unread: 1,
    messages: [
      { id: 'm1', sender: 'peer', text: 'Hey Alex! Did you finish the graph traversal problem for CS301?', timestamp: '10:30 AM' },
      { id: 'm2', sender: 'user', text: 'Working on Dijkstra right now! Almost done with the priority queue implementation.', timestamp: '10:32 AM' },
      { id: 'm3', sender: 'peer', text: 'Awesome! Are you coming to the CS301 review session tonight?', timestamp: '10:35 AM' }
    ]
  },
  {
    id: 'conv-2',
    peerId: 'peer-2',
    peerName: 'Elena Rostova',
    peerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    lastMessage: 'I uploaded the PyTorch starter code to our shared study folder!',
    unread: 0,
    messages: [
      { id: 'm4', sender: 'peer', text: 'Hi! Let me know if you need the dataset link for CS420.', timestamp: 'Yesterday' },
      { id: 'm5', sender: 'user', text: 'Thanks Elena! Just downloaded it.', timestamp: 'Yesterday' },
      { id: 'm6', sender: 'peer', text: 'I uploaded the PyTorch starter code to our shared study folder!', timestamp: 'Yesterday' }
    ]
  }
];

export const DataProvider = ({ children }) => {
  const [peers, setPeers] = useState(INITIAL_PEERS);
  const [studyGroups, setStudyGroups] = useState(INITIAL_STUDY_GROUPS);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [schedule] = useState(INITIAL_SCHEDULE);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);

  // Study Timer & Stats State
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(165); // 2h 45m
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Helper to get active user
  const getStoredUser = () => {
    try {
      const savedUser = localStorage.getItem('nextstep_user') || localStorage.getItem('shilpisetu_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  };

  // Load Groups and Assignments from backend
  const loadInitialData = useCallback(async () => {
    const currentUser = getStoredUser();
    const userId = currentUser?.id || 'demo-1';

    // 1. Fetch study groups from Supabase
    const backendGroups = await apiService.getStudyGroups(userId);
    if (backendGroups && backendGroups.length > 0) {
      setStudyGroups(backendGroups);
    }

    // 2. Fetch assignments from Supabase
    const backendAssignments = await apiService.getAssignments(userId);
    if (backendAssignments && backendAssignments.length > 0) {
      setAssignments(backendAssignments);
    }

    // 3. Fetch conversations from Supabase
    const backendConvs = await apiService.getConversations(userId);
    if (backendConvs && backendConvs.length > 0) {
      setConversations(backendConvs);
    }
  }, []);

  // Fetch peers from backend / Supabase
  const refreshPeers = useCallback(async () => {
    try {
      const currentUser = getStoredUser();
      const excludeId = currentUser?.id;
      const excludeEmail = currentUser?.email;

      const backendPeers = await apiService.getPeers(excludeId, excludeEmail);
      if (backendPeers && backendPeers.length > 0) {
        setPeers(prev => {
          const connectionMap = {};
          prev.forEach(p => { connectionMap[p.id] = p.connectionState; });

          return backendPeers.map(bp => ({
            ...bp,
            status: bp.status || 'online',
            matchScore: bp.matchScore || Math.floor(Math.random() * 15) + 80,
            connectionState: connectionMap[bp.id] || bp.connectionState || 'none',
            gpa: bp.gpa || '3.80',
            year: bp.year || 'Junior',
            skills: bp.skills || ['Problem Solving'],
            courses: bp.courses || ['CS101 Intro to Computer Science'],
            bio: bp.bio || 'Student on BridgeUp platform.',
            avatar: bp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${bp.email || bp.id}`
          }));
        });
      }
    } catch (err) {
      // Keep seed data on network blip
    }
  }, []);

  useEffect(() => {
    refreshPeers();
    loadInitialData();
    const interval = setInterval(refreshPeers, 15000);
    return () => clearInterval(interval);
  }, [refreshPeers, loadInitialData]);

  // Toggle connection status with a peer (persisted in Supabase)
  const toggleConnection = (peerId) => {
    const currentUser = getStoredUser();
    const userId = currentUser?.id || 'demo-1';

    setPeers(prev => prev.map(p => {
      if (p.id === peerId) {
        const nextState = p.connectionState === 'connected' ? 'none' : 'connected';
        return { ...p, connectionState: nextState };
      }
      return p;
    }));

    // Send to backend / Supabase
    apiService.toggleConnection(userId, peerId);
  };

  // Join or Leave Study Group (persisted in Supabase)
  const toggleGroupJoin = (groupId) => {
    const currentUser = getStoredUser();
    const userId = currentUser?.id || 'demo-1';
    const userName = currentUser?.name || 'Student';

    setStudyGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const isJoined = !g.isJoined;
        return {
          ...g,
          isJoined,
          membersCount: isJoined ? g.membersCount + 1 : Math.max(1, g.membersCount - 1)
        };
      }
      return g;
    }));

    apiService.toggleGroupJoin(groupId, userId, userName);
  };

  // Add new Study Group (persisted in Supabase)
  const addStudyGroup = async (newGroup) => {
    const currentUser = getStoredUser();

    const groupObj = {
      id: 'sg-' + Date.now(),
      ...newGroup,
      membersCount: 1,
      maxMembers: newGroup.maxMembers || 20,
      isJoined: true
    };
    setStudyGroups(prev => [groupObj, ...prev]);

    apiService.createStudyGroup({
      ...newGroup,
      leader: currentUser?.name || 'Student Leader',
      leaderId: currentUser?.id || 'demo-1'
    });
  };

  // Update Assignment Status (persisted in Supabase)
  const updateAssignmentStatus = (id, newStatus) => {
    const currentUser = getStoredUser();
    const userId = currentUser?.id || 'demo-1';

    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    apiService.updateAssignmentStatus(id, newStatus, userId);
  };

  // Add new Assignment (persisted in Supabase)
  const addAssignment = (newAssignment) => {
    const currentUser = getStoredUser();
    const userId = currentUser?.id || 'demo-1';

    const assignmentObj = {
      id: 'asg-' + Date.now(),
      ...newAssignment,
      status: 'todo'
    };
    setAssignments(prev => [assignmentObj, ...prev]);

    apiService.createAssignment({
      ...newAssignment,
      userId
    });
  };

  // Send Message & trigger peer reply (persisted in Supabase)
  const sendMessage = (convId, text) => {
    const currentUser = getStoredUser();
    const userId = currentUser?.id || 'demo-1';

    const currentConv = conversations.find(c => c.id === convId);

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          lastMessage: text,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    // Send user message to Supabase
    apiService.sendMessage({
      conversationId: convId,
      senderId: userId,
      senderType: 'user',
      text,
      peerId: currentConv?.peerId,
      peerName: currentConv?.peerName,
      peerAvatar: currentConv?.peerAvatar
    });

    // Trigger automated peer reply after 1.5s
    setTimeout(() => {
      const replies = [
        "That sounds awesome! Let's get together at the library around 5 PM to discuss.",
        "Good call! I was just reviewing that exact section. Let me send over my notes.",
        "Got it! Thanks for letting me know, good luck with the assignment!",
        "100% agree! We should invite the rest of the study group as well.",
        "Awesome! I'll catch up with you right after my lecture."
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      const autoReplyObj = {
        id: 'msg-auto-' + Date.now(),
        sender: 'peer',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessage: randomReply,
            messages: [...c.messages, autoReplyObj]
          };
        }
        return c;
      }));

      // Send peer auto-reply to Supabase
      apiService.sendMessage({
        conversationId: convId,
        senderId: currentConv?.peerId || 'peer',
        senderType: 'peer',
        text: randomReply,
        peerId: currentConv?.peerId,
        peerName: currentConv?.peerName,
        peerAvatar: currentConv?.peerAvatar
      });
    }, 1500);
  };

  // Start new Conversation with peer
  const startConversation = (peer) => {
    const existing = conversations.find(c => c.peerId === peer.id);
    if (existing) return existing.id;

    const convId = 'conv-' + Date.now();
    const newConv = {
      id: convId,
      peerId: peer.id,
      peerName: peer.name,
      peerAvatar: peer.avatar,
      lastMessage: `Started a conversation with ${peer.name}`,
      unread: 0,
      messages: [
        {
          id: 'msg-init-' + Date.now(),
          sender: 'peer',
          text: `Hey! Thanks for connecting on BridgeUp. How are your classes going?`,
          timestamp: 'Just now'
        }
      ]
    };

    setConversations(prev => [newConv, ...prev]);

    // Persist initial message to Supabase
    apiService.sendMessage({
      conversationId: convId,
      senderId: peer.id,
      senderType: 'peer',
      text: `Hey! Thanks for connecting on BridgeUp. How are your classes going?`,
      peerId: peer.id,
      peerName: peer.name,
      peerAvatar: peer.avatar
    });

    return convId;
  };

  // Record completed study focus minutes
  const addFocusMinutes = (mins) => {
    setTodayFocusMinutes(prev => prev + mins);
  };

  return (
    <DataContext.Provider value={{
      peers,
      studyGroups,
      assignments,
      schedule,
      conversations,
      todayFocusMinutes,
      isTimerActive,
      setIsTimerActive,
      toggleConnection,
      toggleGroupJoin,
      addStudyGroup,
      updateAssignmentStatus,
      addAssignment,
      sendMessage,
      startConversation,
      addFocusMinutes,
      refreshPeers
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
