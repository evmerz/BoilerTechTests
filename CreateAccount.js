import React, { useState } from 'react';
import axios from 'axios';

const CreateAccount = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:5500//create-account', {
        username,
        password
      });
      console.log(response.data.message);
    } catch (error) {
      console.error('There was an error creating the account!', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Username:
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <label>
        Password:
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="submit">Create Account</button>
    </form>
  );
};

export default CreateAccount;
