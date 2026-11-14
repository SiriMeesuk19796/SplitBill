
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.user import User


def seed_data():
    db = SessionLocal()

    try:
        # 1. Create users if they do not exist
        usernames = ["alice", "bob", "carol", "dan"]

        users = {}

        for username in usernames:
            user = db.scalar(
                select(User).where(User.username == username)
            )

            if user is None:
                user = User(
                    username=username,
                    display_name=username.capitalize(),
                )
                db.add(user)

            users[username] = user

        db.flush()

        # 2. Create groups if they do not exist
        group_names = {
            "chiang_mai": "Chiang Mai trip",
            "office_lunch": "Office lunch",
        }

        groups = {}

        for key, name in group_names.items():
            group = db.scalar(
                select(Group).where(Group.name == name)
            )

            if group is None:
                group = Group(name=name)
                db.add(group)

            groups[key] = group

        db.flush()

        # 3. Define group memberships
        memberships = [
            (groups["chiang_mai"], users["alice"]),
            (groups["chiang_mai"], users["bob"]),
            (groups["chiang_mai"], users["carol"]),
            (groups["office_lunch"], users["bob"]),
            (groups["office_lunch"], users["dan"]),
        ]

        for group, user in memberships:
            existing = db.scalar(
                select(GroupMember).where(
                    GroupMember.group_id == group.id,
                    GroupMember.user_id == user.id,
                )
            )

            if existing is None:
                db.add(
                    GroupMember(
                        group_id=group.id,
                        user_id=user.id,
                    )
                )

        db.commit()
        print("Seed data created successfully!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
