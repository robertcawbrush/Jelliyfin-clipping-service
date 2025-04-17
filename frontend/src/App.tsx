import { BrowserRouter as Router, Routes, Route } from 'react-router';
import HomeContainer from "./pages/Home.container.tsx";
import LoginContainer from "./pages/Login.container.tsx";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";

const App = () => {
    // init
    useEffect(() => {
        // TODO: get server config, if config exists then login
    });

    return (
        <Provider store={store}>
            <Router>
                <Routes>
                    <Route path="/" element={<HomeContainer />} />
                    <Route path="/login" element={<LoginContainer />} />
                </Routes>
            </Router>
        </Provider>
    );
};

export default App;
