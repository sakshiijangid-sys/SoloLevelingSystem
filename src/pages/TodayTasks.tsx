import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { DailyTask } from '../types';

export default function TodayTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>();
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const ownTasks = query(collectionGroup(db, 'dailyTasks'), where('userId', '==', user.uid));
    return onSnapshot(ownTasks, snapshot => {
      setError(false);
      setTasks(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as DailyTask))
        .filter(task => task.date === today));
    }, () => setError(true));
  }, [user?.uid]);

  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 pb-10 pt-28">
      <h1 className="text-2xl font-bold">Today's tasks</h1>
      {error ? <p role="alert">Tasks could not be loaded.</p>
        : !tasks ? <p role="status">Loading tasks…</p>
        : tasks.length === 0 ? <p>No tasks scheduled today.</p>
        : <ul className="space-y-2">
          {tasks.map(task => (
            <li key={`${task.projectId}/${task.id}`}>
              <Link className="underline" to={`/project/${task.projectId}`}>{task.text}</Link>
              {task.completed && <span className="ml-2">Completed</span>}
            </li>
          ))}
        </ul>}
    </main>
  );
}
