import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION } from '../lib/graphql';
import { useApi } from '../lib/ApiContext';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useApi();

  const [registerMutation, { loading, error }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      login(data.register.user, data.register.token);
      navigate('/');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation({ variables: { name, email, password } });
  };

  return (
    <div className="register-page">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        {error && <p className="error">Error: {error.message}</p>}
      </form>
    </div>
  );
}

export default RegisterPage;