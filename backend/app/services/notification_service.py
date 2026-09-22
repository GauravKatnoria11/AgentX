import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.supabase import MOCK_DATA


class NotificationService:
    def get_user_notifications(self, user_id: str) -> List[Dict[str, Any]]:
        return [n for n in MOCK_DATA["notifications"] if str(n["user_id"]) == str(user_id)]

    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        for n in MOCK_DATA["notifications"]:
            if str(n["id"]) == str(notification_id) and str(n["user_id"]) == str(user_id):
                n["is_read"] = True
                return True
        return False

    def create_notification(self, user_id: str, title: str, message: str, notif_type: str = "general", link: Optional[str] = None):
        entry = {
            "id": str(uuid.uuid4()),
            "user_id": str(user_id),
            "title": title,
            "message": message,
            "type": notif_type,
            "is_read": False,
            "link": link,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_DATA["notifications"].append(entry)
        return entry


notification_service = NotificationService()
