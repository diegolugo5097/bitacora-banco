import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { TaskRepositoryProvider } from './context/TaskRepositoryContext';
import { createTaskRepository } from './data';
import './styles/global.css';

async function bootstrap() {
  const repository = await createTaskRepository();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <TaskRepositoryProvider repository={repository}>
        <App />
      </TaskRepositoryProvider>
    </StrictMode>,
  );
}

void bootstrap();
