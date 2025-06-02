/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (formData) => {
  try {
    // Convert FormData to a readable format for logging
    const formDataEntries = [];
    for (let pair of formData.entries()) {
      formDataEntries.push(`${pair[0]}: ${pair[1]}`);
    }
    console.log('Form Data:', formDataEntries.join(', '));

    const domain = window.location.origin;
    const res = await axios({
      method: 'POST',
      url: `${domain}/api/v1/users/signup`,
      data: formData
    });
    console.log('Response:', res.data);

    if (res.data.status === 'success') {
      showAlert('success', 'Signup successful! Redirecting...');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
    showAlert('error', err.response ? err.response.data.message : 'An error occurred');
  }
};
