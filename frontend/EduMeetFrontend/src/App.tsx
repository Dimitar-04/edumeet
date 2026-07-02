import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios
      .get('http://localhost:5062/api/home')
      .then((res) => setMessage(res.data.message))
      .catch((err) => console.error(err));
  }, []);

  return <h1>{message}</h1>;
}

export default App;
