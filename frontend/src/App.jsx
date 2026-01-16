import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import ChatInterface from './components/ChatInterface/ChatInterface.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<ChatInterface />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
