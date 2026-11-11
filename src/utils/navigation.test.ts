import test from 'node:test';
import assert from 'node:assert/strict';
import { getAppBasePath, getTabFromLocation, getTabUrl } from './navigation.js';

test('getAppBasePath extracts repo subpath correctly on GitHub Pages', () => {
  globalThis.window = {
    location: {
      pathname: '/1-8_study/',
      search: '',
      hash: '',
    },
  } as unknown as Window & typeof globalThis;

  assert.equal(getAppBasePath(), '/1-8_study/');
});

test('getAppBasePath handles subpath with route like /1-8_study/edit', () => {
  globalThis.window = {
    location: {
      pathname: '/1-8_study/edit',
      search: '',
      hash: '',
    },
  } as unknown as Window & typeof globalThis;

  assert.equal(getAppBasePath(), '/1-8_study/');
});

test('getAppBasePath returns "/" for root paths', () => {
  globalThis.window = {
    location: {
      pathname: '/',
      search: '',
      hash: '',
    },
  } as unknown as Window & typeof globalThis;

  assert.equal(getAppBasePath(), '/');
});

test('getTabFromLocation resolves tabs from hash', () => {
  globalThis.window = {
    location: {
      pathname: '/1-8_study/',
      search: '',
      hash: '#/scores',
    },
  } as unknown as Window & typeof globalThis;

  assert.equal(getTabFromLocation(), 'scores');

  globalThis.window.location.hash = '#/materials';
  assert.equal(getTabFromLocation(), 'materials');

  globalThis.window.location.hash = '#edit';
  assert.equal(getTabFromLocation(), 'edit');
});

test('getTabFromLocation resolves edit tab from pathname', () => {
  globalThis.window = {
    location: {
      pathname: '/1-8_study/edit',
      search: '',
      hash: '',
    },
  } as unknown as Window & typeof globalThis;

  assert.equal(getTabFromLocation(), 'edit');
});

test('getTabUrl retains the GitHub Pages repo path and formats hash', () => {
  globalThis.window = {
    location: {
      pathname: '/1-8_study/',
      search: '',
      hash: '',
    },
  } as unknown as Window & typeof globalThis;

  assert.equal(getTabUrl('portal'), '/1-8_study/');
  assert.equal(getTabUrl('scores'), '/1-8_study/#/scores');
  assert.equal(getTabUrl('materials'), '/1-8_study/#/materials');
  assert.equal(getTabUrl('edit'), '/1-8_study/#/edit');
});
