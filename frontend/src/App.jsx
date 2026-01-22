import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import ChatInterface from './components/ChatInterface/ChatInterface.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import VoiceCall from './components/VoiceCall/VoiceCall.jsx';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    <>
                        <Header />
                        <ChatInterface />
                    </>
                } />
                <Route path="/dashboard" element={
                    <>
                        <Header />
                        <Dashboard />
                    </>
                } />
                <Route path="/call" element={<VoiceCall />} />
            </Routes>
        </Router>
    );
}

export default App;
