/**
 * Full-page view of the Tuu Beetuu assistant.
 *
 * The conversation lives in the AssistantProvider mounted by AdminLayout, so
 * this page and the floating widget share one thread. This component is only the
 * page shell.
 */

import React from 'react';
import AssistantPanel from '../../components/admin/AssistantPanel';

const AdminAssistant: React.FC = () => <AssistantPanel mode="page" />;

export default AdminAssistant;
