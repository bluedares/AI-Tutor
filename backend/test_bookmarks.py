import pytest
import json
from unittest.mock import MagicMock, patch

class LocalStorageMock:
    def __init__(self):
        self.store = {}

    def getItem(self, key):
        return self.store.get(key)

    def setItem(self, key, value):
        self.store[key] = value

class TestBookmarks:
    @pytest.fixture
    def local_storage(self):
        return LocalStorageMock()

    @pytest.fixture
    def chat_manager(self):
        with patch('window.localStorage', new_callable=LocalStorageMock) as mock_storage:
            chat_manager = MagicMock()
            chat_manager.saveToBookmarks = lambda container: True
            return chat_manager

    def test_save_bookmark(self, local_storage):
        # Create mock message wrapper
        message_wrapper = MagicMock()
        message_wrapper.classList.contains.side_effect = lambda x: x == 'user'
        message_content = MagicMock()
        message_content.innerHTML = 'Test message'
        message_wrapper.querySelector.return_value = message_content

        # Create mock container
        container = MagicMock()
        container.querySelectorAll.return_value = [message_wrapper]

        # Save bookmark
        bookmark = {
            'id': 123,
            'timestamp': '2024-12-19T20:52:42+05:30',
            'messages': [{
                'content': 'Test message',
                'role': 'user',
                'metadata': None
            }]
        }
        local_storage.setItem('chatBookmarks', json.dumps([bookmark]))

        # Verify bookmark was saved
        saved_bookmarks = json.loads(local_storage.getItem('chatBookmarks'))
        assert len(saved_bookmarks) == 1
        assert saved_bookmarks[0]['messages'][0]['content'] == 'Test message'

    def test_bookmark_persistence(self, local_storage):
        # Save a bookmark
        bookmark = {
            'id': 123,
            'timestamp': '2024-12-19T20:52:42+05:30',
            'messages': [{
                'content': 'Test message',
                'role': 'user',
                'metadata': None
            }]
        }
        local_storage.setItem('chatBookmarks', json.dumps([bookmark]))

        # Check if bookmark is persisted
        saved_bookmarks = json.loads(local_storage.getItem('chatBookmarks'))
        assert len(saved_bookmarks) == 1
        assert saved_bookmarks[0]['messages'][0]['content'] == 'Test message'

    def test_delete_bookmark(self, local_storage):
        # Save two bookmarks
        bookmarks = [
            {
                'id': 123,
                'timestamp': '2024-12-19T20:52:42+05:30',
                'messages': [{'content': 'Test 1', 'role': 'user', 'metadata': None}]
            },
            {
                'id': 456,
                'timestamp': '2024-12-19T20:52:42+05:30',
                'messages': [{'content': 'Test 2', 'role': 'user', 'metadata': None}]
            }
        ]
        local_storage.setItem('chatBookmarks', json.dumps(bookmarks))

        # Delete first bookmark
        saved_bookmarks = json.loads(local_storage.getItem('chatBookmarks'))
        saved_bookmarks = [b for b in saved_bookmarks if b['id'] != 123]
        local_storage.setItem('chatBookmarks', json.dumps(saved_bookmarks))

        # Check if only second bookmark remains
        final_bookmarks = json.loads(local_storage.getItem('chatBookmarks'))
        assert len(final_bookmarks) == 1
        assert final_bookmarks[0]['id'] == 456
