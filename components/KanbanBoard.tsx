"use client";
import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description?: string;
  list_id: string;
};

type List = {
  id: string;
  name: string;
  position: number;
};

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tasks
        const taskRes = await fetch(
          "http://localhost:3000/api/v1/boards/a4d59936-bbf3-4994-80e6-6335f6794cdd/tasks",
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            },
          }
        );
        const taskData = await taskRes.json();
        setTasks(Array.isArray(taskData.data) ? taskData.data : []);

        // Fetch lists
        const listRes = await fetch(
          "http://localhost:3000/api/v1/boards/a4d59936-bbf3-4994-80e6-6335f6794cdd/lists",
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            },
          }
        );
        const listData = await listRes.json();
        setLists(Array.isArray(listData.data) ? listData.data : []);
      } catch (err) {
        console.error("Failed to fetch board data:", err);
        setTasks([]);
        setLists([]);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-6 bg-slate-100 text-slate-900 min-h-screen">
      <h2 className="text-xl font-bold mb-6">Kanban Board</h2>
      <div className="flex gap-6">
        {lists
          .sort((a, b) => a.position - b.position)
          .map((list) => (
            <div
              key={list.id}
              className="flex-1 bg-white p-4 rounded shadow"
            >
              <h3 className="text-lg font-semibold mb-3">{list.name}</h3>
              <div className="space-y-2">
               {tasks
                 .filter((task) => task.list_id === list.id)
                 .map((task) => (
                  <div key={task.id} className="bg-slate-100 p-3 rounded shadow">
                  <p className="font-semibold">{task.title}</p>
                  {task.description && (
                     <p className="text-sm text-slate-600">{task.description}</p>
                    )}
                  </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
