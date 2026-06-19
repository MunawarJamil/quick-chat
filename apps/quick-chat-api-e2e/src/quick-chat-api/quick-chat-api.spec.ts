import axios from 'axios';

describe('GET /api', () => {
  it('returns the application data', async () => {
    const res = await axios.get('/api');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      message: 'Hello Shared Utils',
      user: {
        id: '1',
        email: 'test@quickchat.com',
        name: 'Munawar',
      },
    });
  });
});
