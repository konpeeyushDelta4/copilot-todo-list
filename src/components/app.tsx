"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Todo } from "@/types/todo";
import { Navigation } from "@/components/navigation";
import { TodoList } from "@/components/todo-app";
import { KanbanBoard } from "@/components/kanban-board";
import { YourGPT, useAIActions } from "@yourgpt/widget-web-sdk/react";

// Initialize SDK
YourGPT.init({
  widgetId: "271f1c55-4a82-4c7f-9634-762078763943",
  endpoint: "https://widget.yourgpt.ai",
  debug: true,
});

interface ToolFunction {
  arguments: string;
  name: string;
}

interface ActionData {
  action: {
    tool: {
      function: ToolFunction;
    };
  };
}

interface AppProps {
  view: "list" | "kanban";
}

export function App({ view }: AppProps) {
  const currentView = view;
  const [todos, setTodos] = useState<Todo[]>([]);

  const aiActions = useAIActions();

  const applyTheme = (theme: string) => {
    document.documentElement.className = theme === "light" ? "" : theme;
    localStorage.setItem("theme", theme);
  };

  useEffect(() => {
    aiActions.registerAction("change_theme", async (data, action) => {
      console.log("change_theme", data);

      const actionData = data as ActionData;
      const args = actionData.action?.tool?.function?.arguments || `{}`;
      const theme = JSON.parse(args).theme;

      applyTheme(theme);

      action.respond("Theme changed to " + theme);
    });

    return () => {
      aiActions.unregisterAction("change_theme");
    };
  }, []);

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos).map(
          (
            todo: Todo & {
              createdAt: string;
              updatedAt: string;
              dueDate?: string;
            }
          ) => ({
            ...todo,
            createdAt: new Date(todo.createdAt),
            updatedAt: new Date(todo.updatedAt),
            dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          })
        );
        setTodos(parsedTodos);
      } catch (error) {
        console.error("Error parsing todos from localStorage:", error);
      }
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const handleUpdateTodo = (updatedTodo: Todo) => {
    setTodos((prevTodos) => {
      const existingTodoIndex = prevTodos.findIndex((todo) => todo.id === updatedTodo.id);

      if (existingTodoIndex >= 0) {
        // Update existing todo
        const newTodos = [...prevTodos];
        newTodos[existingTodoIndex] = updatedTodo;
        return newTodos;
      } else {
        // Add new todo
        return [updatedTodo, ...prevTodos];
      }
    });
  };

  const handleCreateTodo = (todoData: Omit<Todo, "id" | "createdAt" | "updatedAt">) => {
    const newTodo: Todo = {
      ...todoData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTodos((prevTodos) => [newTodo, ...prevTodos]);
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} />

      <main className="container mx-auto px-0 py-8">
        <motion.div key={currentView} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
          {currentView === "list" ? (
            <TodoList todos={todos} onUpdateTodo={handleUpdateTodo} onCreateTodo={handleCreateTodo} onDeleteTodo={handleDeleteTodo} />
          ) : (
            <KanbanBoard todos={todos} onUpdateTodo={handleUpdateTodo} onCreateTodo={handleCreateTodo} onDeleteTodo={handleDeleteTodo} />
          )}
        </motion.div>
      </main>
    </div>
  );
}
