import { BrowserRouter as Router, Routes, Route } from 'react-router';
import HomeContainer from './pages/Home.container.tsx';
import LoginContainer from './pages/Login.container.tsx';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

// TODO: add login auth
// TODO: add thunks
// TODO: add add clip list datagrid, with delete feature and view and warning about cron job
// TODO: add new clip component
// TODO: add

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
