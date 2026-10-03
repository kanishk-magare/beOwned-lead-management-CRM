import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback.jsx';

export default function NotFound() {
  return (
    <div className="card text-center py-12">
      <EmptyState title="Page not found">
        <Link to="/dashboard" className="btn btn-sm mt-3">
          Go to dashboard
        </Link>
      </EmptyState>
    </div>
  );
}
