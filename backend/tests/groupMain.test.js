/**
 * Tests for GET    /api/group-main/search
 *           GET    /api/group-main/search/:userId
 *           POST   /api/group-main/create/:userId
 *           PUT    /api/group-main/edit/:userId/:groupId
 *           DELETE /api/group-main/delete/:userId/:groupId
 *           POST   /api/group-main/join/:userId/:groupId
 *           POST   /api/group-main/leave/:userId/:groupId
 */

const request = require('supertest');
const app = require('./helpers/testApp');
const db = require('./helpers/db');
const { createVerifiedUser, createGroup } = require('./helpers/factories');
const User = require('../models/User');
const Group = require('../models/Group');

beforeAll(db.connect);
afterEach(db.clearCollections);
afterAll(db.disconnect);

// GET /api/group-main/search
describe('GET /api/group-main/search', () => {
  it('returns 200 and all groups when no searchBar is provided', async () => {
    const owner = await createVerifiedUser();
    await createGroup(owner, { name: 'Book Lovers' });
    await createGroup(owner, { name: 'Mystery Fans' });

    const res = await request(app).get('/api/group-main/search');

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(2);
  });

  it('filters groups by name when searchBar is provided', async () => {
    const owner = await createVerifiedUser();
    await createGroup(owner, { name: 'Alpha Readers' });
    await createGroup(owner, { name: 'Beta Club' });

    const res = await request(app).get('/api/group-main/search').query({ searchBar: 'alpha' });

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].name).toBe('Alpha Readers');
  });

  it('filters groups by description when searchBar matches description', async () => {
    const owner = await createVerifiedUser();
    await createGroup(owner, { name: 'Group X', description: 'science fiction enthusiasts' });
    await createGroup(owner, { name: 'Group Y', description: 'romance novels' });

    const res = await request(app).get('/api/group-main/search').query({ searchBar: 'science' });

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(1);
  });

  it('returns an empty array when no groups match the search', async () => {
    const owner = await createVerifiedUser();
    await createGroup(owner, { name: 'Readers Club' });

    const res = await request(app).get('/api/group-main/search').query({ searchBar: 'zzznomatch' });

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(0);
  });
});

// GET /api/group-main/search/:userId
describe('GET /api/group-main/search/:userId', () => {
  it('returns only the groups that the user has joined', async () => {
    const owner = await createVerifiedUser();
    const member = await createVerifiedUser();
    const groupA = await createGroup(owner, { name: 'Joined Group' });
    const _groupB = await createGroup(owner, { name: 'Not Joined Group' });

    // Make member join groupA
    member.joinedGroups.push(groupA._id);
    await member.save();

    const res = await request(app).get(`/api/group-main/search/${member._id}`);

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].name).toBe('Joined Group');
  });

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app).get('/api/group-main/search/64a1b2c3d4e5f6a7b8c9d0e1');
    expect(res.status).toBe(404);
  });

  it('filters joined groups by searchBar', async () => {
    const owner = await createVerifiedUser();
    const member = await createVerifiedUser();
    const groupA = await createGroup(owner, { name: 'Alpha Club' });
    const groupB = await createGroup(owner, { name: 'Beta Club' });

    member.joinedGroups.push(groupA._id, groupB._id);
    await member.save();

    const res = await request(app)
      .get(`/api/group-main/search/${member._id}`)
      .query({ searchBar: 'alpha' });

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].name).toBe('Alpha Club');
  });
});

// POST /api/group-main/create/:userId
describe('POST /api/group-main/create/:userId', () => {
  it('creates a group and returns 201 with the group data', async () => {
    const owner = await createVerifiedUser();

    const res = await request(app)
      .post(`/api/group-main/create/${owner._id}`)
      .send({ name: 'New Group', description: 'We read books.' });

    expect(res.status).toBe(201);
    expect(res.body.group.name).toBe('New Group');
    expect(res.body.group.owner).toBe(owner._id.toString());
  });

  it('adds the group to the user\'s joinedGroups and createdGroups', async () => {
    const owner = await createVerifiedUser();

    const res = await request(app)
      .post(`/api/group-main/create/${owner._id}`)
      .send({ name: 'My Group' });

    const updatedUser = await User.findById(owner._id);
    const groupId = res.body.group._id;
    expect(updatedUser.joinedGroups.map(String)).toContain(groupId);
    expect(updatedUser.createdGroups.map(String)).toContain(groupId);
  });

  it('returns 400 when name is empty', async () => {
    const owner = await createVerifiedUser();
    const res = await request(app)
      .post(`/api/group-main/create/${owner._id}`)
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name cannot be empty/i);
  });

  it('returns 401 when the user is not verified', async () => {
    const unverified = await createVerifiedUser();
    await User.findByIdAndUpdate(unverified._id, { isVerified: false });

    const res = await request(app)
      .post(`/api/group-main/create/${unverified._id}`)
      .send({ name: 'Ghost Group' });

    expect(res.status).toBe(401);
  });

  it('returns 404 when the user does not exist', async () => {
    const res = await request(app)
      .post('/api/group-main/create/64a1b2c3d4e5f6a7b8c9d0e1')
      .send({ name: 'Phantom Group' });

    expect(res.status).toBe(404);
  });
});

// PUT /api/group-main/edit/:userId/:groupId
describe('PUT /api/group-main/edit/:userId/:groupId', () => {
  it('updates the group name and description and returns 200', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner);

    const res = await request(app)
      .put(`/api/group-main/edit/${owner._id}/${group._id}`)
      .send({ name: 'Updated Name', description: 'Updated desc.' });

    expect(res.status).toBe(200);
    expect(res.body.group.name).toBe('Updated Name');
    expect(res.body.group.description).toBe('Updated desc.');
  });

  it('returns 400 when the new name is empty', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner);

    const res = await request(app)
      .put(`/api/group-main/edit/${owner._id}/${group._id}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-owner tries to edit', async () => {
    const owner = await createVerifiedUser();
    const member = await createVerifiedUser();
    const group = await createGroup(owner);

    const res = await request(app)
      .put(`/api/group-main/edit/${member._id}/${group._id}`)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(403);
  });

  it('returns 404 when the group does not exist', async () => {
    const owner = await createVerifiedUser();
    const res = await request(app)
      .put(`/api/group-main/edit/${owner._id}/64a1b2c3d4e5f6a7b8c9d0e1`)
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });
});

// DELETE /api/group-main/delete/:userId/:groupId
describe('DELETE /api/group-main/delete/:userId/:groupId', () => {
  it('deletes the group and removes it from all members\' lists', async () => {
    const owner = await createVerifiedUser();
    const member = await createVerifiedUser();
    const group = await createGroup(owner);

    group.members.push(member._id);
    await group.save();
    member.joinedGroups.push(group._id);
    await member.save();

    const res = await request(app)
      .delete(`/api/group-main/delete/${owner._id}/${group._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const deletedGroup = await Group.findById(group._id);
    expect(deletedGroup).toBeNull();

    const updatedMember = await User.findById(member._id);
    expect(updatedMember.joinedGroups.map(String)).not.toContain(group._id.toString());
  });

  it('returns 403 when a non-owner tries to delete', async () => {
    const owner = await createVerifiedUser();
    const other = await createVerifiedUser();
    const group = await createGroup(owner);

    const res = await request(app)
      .delete(`/api/group-main/delete/${other._id}/${group._id}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when the group does not exist', async () => {
    const owner = await createVerifiedUser();
    const res = await request(app)
      .delete(`/api/group-main/delete/${owner._id}/64a1b2c3d4e5f6a7b8c9d0e1`);

    expect(res.status).toBe(404);
  });
});

// POST /api/group-main/join/:userId/:groupId
describe('POST /api/group-main/join/:userId/:groupId', () => {
  it('adds the user to the group and returns 200', async () => {
    const owner = await createVerifiedUser();
    const joiner = await createVerifiedUser();
    const group = await createGroup(owner);

    const res = await request(app)
      .post(`/api/group-main/join/${joiner._id}/${group._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/joined/i);

    const updatedGroup = await Group.findById(group._id);
    expect(updatedGroup.members.map(String)).toContain(joiner._id.toString());
  });

  it('returns 409 when the user is already a member', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner); // owner is already a member

    const res = await request(app)
      .post(`/api/group-main/join/${owner._id}/${group._id}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already/i);
  });

  it('returns 401 when the user is not verified', async () => {
    const owner = await createVerifiedUser();
    const unverified = await createVerifiedUser();
    const group = await createGroup(owner);
    await User.findByIdAndUpdate(unverified._id, { isVerified: false });

    const res = await request(app)
      .post(`/api/group-main/join/${unverified._id}/${group._id}`);

    expect(res.status).toBe(401);
  });
});

// POST /api/group-main/leave/:userId/:groupId
describe('POST /api/group-main/leave/:userId/:groupId', () => {
  it('removes a regular member from the group', async () => {
    const owner = await createVerifiedUser();
    const member = await createVerifiedUser();
    const group = await createGroup(owner);

    group.members.push(member._id);
    await group.save();
    member.joinedGroups.push(group._id);
    await member.save();

    const res = await request(app)
      .post(`/api/group-main/leave/${member._id}/${group._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/left/i);

    const updatedGroup = await Group.findById(group._id);
    expect(updatedGroup.members.map(String)).not.toContain(member._id.toString());
  });

  it('transfers ownership when the owner leaves and others remain', async () => {
    const owner = await createVerifiedUser();
    const member = await createVerifiedUser();
    const group = await createGroup(owner);

    group.members.push(member._id);
    await group.save();
    member.joinedGroups.push(group._id);
    await member.save();
    owner.joinedGroups.push(group._id);
    await owner.save();

    const res = await request(app)
      .post(`/api/group-main/leave/${owner._id}/${group._id}`);

    expect(res.status).toBe(200);

    const updatedGroup = await Group.findById(group._id);
    expect(updatedGroup.owner.toString()).toBe(member._id.toString());
  });

  it('deletes the group when the sole owner/member leaves', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner);
    owner.joinedGroups.push(group._id);
    await owner.save();

    const res = await request(app)
      .post(`/api/group-main/leave/${owner._id}/${group._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const deleted = await Group.findById(group._id);
    expect(deleted).toBeNull();
  });

  it('returns 400 when the user is not a member of the group', async () => {
    const owner = await createVerifiedUser();
    const nonMember = await createVerifiedUser();
    const group = await createGroup(owner);

    const res = await request(app)
      .post(`/api/group-main/leave/${nonMember._id}/${group._id}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not in this group/i);
  });
});
