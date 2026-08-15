import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useAppState from './state/useAppState.js';
import deriveVals from './state/deriveVals.js';

import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import TaskModal from './components/TaskModal.jsx';

import LoginScreen from './screens/LoginScreen.jsx';
import SignupScreen from './screens/SignupScreen.jsx';
import DashboardEmptyScreen from './screens/DashboardEmptyScreen.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import CreateGroupScreen from './screens/CreateGroupScreen.jsx';
import GroupCreatedScreen from './screens/GroupCreatedScreen.jsx';
import TeamsScreen from './screens/TeamsScreen.jsx';
import JoinGroupScreen from './screens/JoinGroupScreen.jsx';
import ProjectsScreen from './screens/ProjectsScreen.jsx';
import TeamDetailScreen from './screens/TeamDetailScreen.jsx';
import TimelineScreen from './screens/TimelineScreen.jsx';
import ProgressScreen from './screens/ProgressScreen.jsx';
import ChatScreen from './screens/ChatScreen.jsx';
import AssignmentScreen from './screens/AssignmentScreen.jsx';
import AssignmentDetailScreen from './screens/AssignmentDetailScreen.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import LeaderboardScreen from './screens/LeaderboardScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import AdminScreen from './screens/AdminScreen.jsx';
import AdminSettingsScreen from './screens/AdminSettingsScreen.jsx';

export default function App() {
  const { state, actions } = useAppState();
  const v = deriveVals(state, actions);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsCheckingSession(false);
      return;
    }
    const controller = new AbortController();
    axios.get('/api/check', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then((res) => {
        const isAdminMode = res.data.role === 'admin';
        const currentUser = { name: res.data.nickname, firstName: res.data.nickname, studentId: res.data.studentId || '', userId: res.data.userId };
        actions.completeLogin(currentUser, isAdminMode);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        localStorage.removeItem('token');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCheckingSession(false);
      });
    return () => controller.abort();
  }, []);

  if (isCheckingSession) {
    return <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFF6FF', color: '#6B7280', fontSize: 13.5 }}>กำลังโหลด...</div>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} newestOnTop closeOnClick theme="dark" />
      <TaskModal v={v} />
      <div style={{ width: '100%', height: '100vh', background: '#EFF6FF', display: 'flex', overflow: 'hidden', color: '#111827' }}>
        {v.showSidebar && <Sidebar v={v} />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
          {v.showSidebar && <Header v={v} />}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {v.isLogin && <LoginScreen v={v} />}
            {v.isSignup && <SignupScreen v={v} />}
            {v.isDashboardEmpty && <DashboardEmptyScreen v={v} />}
            {v.isDashboard && <DashboardScreen v={v} />}
            {v.isCreateGroup && <CreateGroupScreen v={v} />}
            {v.isGroupCreated && <GroupCreatedScreen v={v} />}
            {v.isTeams && <TeamsScreen v={v} />}
            {v.isJoinGroup && <JoinGroupScreen v={v} />}
            {v.isProjects && <ProjectsScreen v={v} />}
            {v.isTeamDetail && <TeamDetailScreen v={v} />}
            {v.isTimeline && <TimelineScreen v={v} />}
            {v.isProgress && <ProgressScreen v={v} />}
            {v.isChat && <ChatScreen v={v} />}
            {v.isAssignment && <AssignmentScreen v={v} />}
            {v.isAssignmentDetail && <AssignmentDetailScreen v={v} />}
            {v.isCalendar && <CalendarScreen v={v} />}
            {v.isLeaderboard && <LeaderboardScreen v={v} />}
            {v.isSettings && <SettingsScreen v={v} />}
            {v.isAdmin && <AdminScreen v={v} />}
            {v.isAdminSettings && <AdminSettingsScreen v={v} />}
          </div>
        </div>
      </div>
    </>
  );
}
