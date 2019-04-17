// @flow
import * as React from 'react';
import noop from 'lodash/noop';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { fillUserPlaceholder } from '../../../../utils/fields';
import messages from '../../../common/messages';

import CommentInlineError from '../comment/CommentInlineError';
import IconTaskApproval from '../../../../icons/two-toned/IconTaskApproval';
import IconTaskGeneral from '../../../../icons/two-toned/IconTaskGeneral';

import {
    TASK_NEW_APPROVED,
    TASK_NEW_REJECTED,
    TASK_NEW_NOT_STARTED,
    TASK_NEW_IN_PROGRESS,
    TASK_NEW_COMPLETED,
    TASK_TYPE_APPROVAL,
} from '../../../../constants';
import Comment from '../comment';
import AssigneeStatus from './AssigneeStatus';
import TaskActions from './TaskActions';
import TaskDueDate from './TaskDueDate';
import Status from './TaskStatus';
import './Task.scss';

const MAX_AVATARS = 3;

type Props = {|
    ...TaskNew,
    currentUser: User,
    error?: ActionItemError,
    getAvatarUrl: GetAvatarUrlCallback,
    getMentionWithQuery?: Function,
    getUserProfileUrl?: GetProfileUrlCallback,
    isDisabled?: boolean,
    isPending?: boolean,
    mentionSelectorContacts?: SelectorItems,
    onAssignmentUpdate: Function,
    onDelete?: Function,
    onEdit?: Function,
    translatedTaggedMessage?: string,
    translations?: Translations,
|};

type AssigneeProps = {|
    assignees: TaskAssigneeCollection,
    getAvatarUrl: GetAvatarUrlCallback,
    maxAvatars?: number,
|};

const Assignees = React.memo<AssigneeProps>(({ maxAvatars = MAX_AVATARS, assignees, getAvatarUrl }: AssigneeProps) => {
    const assigneeCount = (assignees && assignees.entries.length) || 0;
    const hiddenAssigneeCount = assigneeCount - maxAvatars;
    return (
        <div className="bcs-task-assignment-container">
            <div className="bcs-task-assignments">
                {assigneeCount > 0 &&
                    assignees.entries
                        .map(fillUserPlaceholder)
                        .slice(0, MAX_AVATARS)
                        .map(({ id: assignmentId, target, status: assigneeStatus }) => {
                            return (
                                <AssigneeStatus
                                    key={assignmentId}
                                    status={assigneeStatus}
                                    user={target}
                                    getAvatarUrl={getAvatarUrl}
                                    data-testid="task-assignment-status"
                                />
                            );
                        })}
                {hiddenAssigneeCount > 0 ? (
                    <span className="bcs-task-assignment-avatar bcs-task-assignment-count">+{hiddenAssigneeCount}</span>
                ) : null}
            </div>
        </div>
    );
});

const getMessageForTask = (isCurrentUser: boolean, taskType: TaskType) => {
    if (isCurrentUser) {
        if (taskType === TASK_TYPE_APPROVAL) {
            return messages.tasksFeedHeadlineApprovalCurrentUser;
        }
        return messages.tasksFeedHeadlineGeneralCurrentUser;
    }

    if (taskType === TASK_TYPE_APPROVAL) {
        return messages.tasksFeedHeadlineApproval;
    }
    return messages.tasksFeedHeadlineGeneral;
};

const Task = ({
    assigned_to,
    created_at,
    created_by,
    currentUser,
    due_at,
    error,
    getAvatarUrl,
    getMentionWithQuery,
    getUserProfileUrl,
    id,
    isPending,
    mentionSelectorContacts,
    name,
    onAssignmentUpdate = noop,
    onDelete,
    onEdit,
    permissions,
    status,
    task_type,
    translatedTaggedMessage,
    translations,
}: Props) => {
    const taskPermissions = {
        ...permissions,
        // can_edit: permissions.can_update,
        can_edit: false,
    };

    const currentUserAssignment =
        assigned_to && assigned_to.entries
            ? assigned_to.entries.find(({ target }) => target.id === currentUser.id)
            : null;

    const shouldShowActions =
        currentUserAssignment &&
        currentUserAssignment.permissions &&
        currentUserAssignment.permissions.can_update &&
        currentUserAssignment.status === TASK_NEW_NOT_STARTED &&
        (status === TASK_NEW_NOT_STARTED || status === TASK_NEW_IN_PROGRESS);

    const TaskTypeIcon = task_type === TASK_TYPE_APPROVAL ? IconTaskApproval : IconTaskGeneral;

    return (
        <div className="bcs-task-container">
            {error ? <CommentInlineError {...error} /> : null}
            <div
                className={classNames('bcs-task', {
                    'bcs-is-pending': isPending || error,
                })}
                data-testid="task-card"
            >
                <Comment
                    avatarRenderer={avatar => (
                        <div className="bcs-task-avatar">
                            {avatar}
                            <TaskTypeIcon width={20} height={20} className="bcs-task-avatar-badge" />
                        </div>
                    )}
                    created_at={created_at}
                    created_by={created_by.target}
                    currentUser={currentUser}
                    id={id}
                    inlineDeleteMessage={messages.taskDeletePrompt}
                    isPending={isPending}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    permissions={taskPermissions}
                    tagged_message={name}
                    translatedTaggedMessage={translatedTaggedMessage}
                    translations={translations}
                    getAvatarUrl={getAvatarUrl}
                    getUserProfileUrl={getUserProfileUrl}
                    mentionSelectorContacts={mentionSelectorContacts}
                    getMentionWithQuery={getMentionWithQuery}
                    userHeadlineRenderer={userLinkInstance => {
                        return (
                            <FormattedMessage
                                {...getMessageForTask(!!currentUserAssignment, task_type)}
                                values={{ user: userLinkInstance }}
                            />
                        );
                    }}
                />
                <div className="bcs-task-content">{!!due_at && <TaskDueDate dueDate={due_at} status={status} />}</div>
                <div className="bcs-task-content">
                    <Assignees maxAvatars={MAX_AVATARS} assignees={assigned_to} getAvatarUrl={getAvatarUrl} />
                </div>
                <div className="bcs-task-content">
                    {currentUserAssignment && shouldShowActions ? (
                        <TaskActions
                            taskType={task_type}
                            onTaskApproval={
                                isPending
                                    ? noop
                                    : () => onAssignmentUpdate(id, currentUserAssignment.id, TASK_NEW_APPROVED)
                            }
                            onTaskReject={
                                isPending
                                    ? noop
                                    : () => onAssignmentUpdate(id, currentUserAssignment.id, TASK_NEW_REJECTED)
                            }
                            onTaskComplete={
                                isPending
                                    ? noop
                                    : () => onAssignmentUpdate(id, currentUserAssignment.id, TASK_NEW_COMPLETED)
                            }
                        />
                    ) : (
                        <Status status={status} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Task;
