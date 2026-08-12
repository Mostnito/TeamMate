import useAppState from './state/useAppState.js';
import deriveVals from './state/deriveVals.js';

import ToastStack from './components/ToastStack.jsx';
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

  return (
    <>
      <ToastStack toasts={v.toasts} dismissToast={v.dismissToast} />
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
