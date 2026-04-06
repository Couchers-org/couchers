from collections.abc import Sequence

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.ext.hybrid import _HybridClassLevelAccessor
from sqlalchemy.orm import Session
from sqlalchemy.sql.base import ExecutableOption

from couchers.models import (
    AdminTag,
    Base,
    Comment,
    ContentReport,
    Discussion,
    ModerationUserList,
    Node,
    Page,
    PhotoGallery,
    Reference,
    Reply,
    Thread,
    Upload,
    User,
)
from couchers.sql import username_or_email_or_id, users_visible

type WhereCondition = ColumnElement[bool] | _HybridClassLevelAccessor[bool]


class BaseRepo[T: Base]:
    model: type[T]

    def __init__(self, session: Session) -> None:
        self.session = session

    def by_id(self, id_: int, options: Sequence[ExecutableOption] | None = None) -> T:
        query = select(self.model).where(self.model.id == id_)  # type: ignore
        if options:
            query = query.options(*options)
        return self.session.execute(query).scalar_one()

    def get_by_id(self, id_: int, options: Sequence[ExecutableOption] | None = None) -> T | None:
        query = select(self.model).where(self.model.id == id_)  # type: ignore
        if options:
            query = query.options(*options)
        return self.session.execute(query).scalar_one_or_none()

    def count(self, where: WhereCondition) -> int:
        query = select(func.count()).select_from(self.model).where(where)
        return self.session.execute(query).scalar_one()


class UserRepo(BaseRepo[User]):
    model = User

    def get_by_username_or_email_or_id(self, val: str) -> User | None:
        query = select(User).where(username_or_email_or_id(val))
        return self.session.execute(query).scalar_one_or_none()

    def get_by_id_if_visible(self, id_: int, visible_to: int) -> User | None:
        query = select(User).where(User.id == id_).where(users_visible(visible_to))
        return self.session.execute(query).scalar_one_or_none()


class AdminTagRepo(BaseRepo[AdminTag]):
    model = AdminTag

    def get_by_tag(self, tag: str) -> AdminTag | None:
        query = select(AdminTag).where(AdminTag.tag == tag)
        return self.session.execute(query).scalar_one_or_none()


class CommentRepo(BaseRepo[Comment]):
    model = Comment


class ThreadRepo(BaseRepo[Thread]):
    model = Thread


class ReplyRepo(BaseRepo[Reply]):
    model = Reply


class DiscussionRepo(BaseRepo[Discussion]):
    model = Discussion


class ReferenceRepo(BaseRepo[Reference]):
    model = Reference


class ModerationUserListRepo(BaseRepo[ModerationUserList]):
    model = ModerationUserList


class ContentReportRepo(BaseRepo[ContentReport]):
    model = ContentReport


class NodeRepo(BaseRepo[Node]):
    model = Node


class PhotoGalleryRepo(BaseRepo[PhotoGallery]):
    model = PhotoGallery


class PageRepo(BaseRepo[Page]):
    model = Page


class UploadRepo(BaseRepo[Upload]):
    model = Upload

    def get_by_key(self, key: str) -> Upload | None:
        query = select(Upload).where(Upload.key == key)
        return self.session.execute(query).scalar_one_or_none()


class DB:
    def __init__(self, session: Session) -> None:
        self._session = session

    @property
    def session(self) -> Session:
        return self._session

    @property
    def users(self) -> UserRepo:
        return UserRepo(self.session)

    @property
    def admin_tags(self) -> AdminTagRepo:
        return AdminTagRepo(self.session)

    @property
    def moderation_user_lists(self) -> ModerationUserListRepo:
        return ModerationUserListRepo(self.session)

    @property
    def comments(self) -> CommentRepo:
        return CommentRepo(self.session)

    @property
    def threads(self) -> ThreadRepo:
        return ThreadRepo(self.session)

    @property
    def replies(self) -> ReplyRepo:
        return ReplyRepo(self.session)

    @property
    def references(self) -> ReferenceRepo:
        return ReferenceRepo(self.session)

    @property
    def discussions(self) -> DiscussionRepo:
        return DiscussionRepo(self.session)

    @property
    def content_reports(self) -> ContentReportRepo:
        return ContentReportRepo(self.session)

    @property
    def nodes(self) -> NodeRepo:
        return NodeRepo(self.session)

    @property
    def photo_galleries(self) -> PhotoGalleryRepo:
        return PhotoGalleryRepo(self.session)

    @property
    def pages(self) -> PageRepo:
        return PageRepo(self.session)

    @property
    def uploads(self) -> UploadRepo:
        return UploadRepo(self.session)
