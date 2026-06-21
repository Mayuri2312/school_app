import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Student = {
  id: string;
  school_id: string;
  school_name: string;
  name: string;
  class: string;
  section: string;
  roll_number: string;
  parent_name: string;
  parent_phone: string;
  avatar_color: string;
  dob: string;
  admission_no: string;
};

export type School = { id: string; name: string; address: string };

type AuthState = {
  student: Student | null;
  school: School | null;
  loading: boolean;
  setSession: (student: Student, school: School) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

const KEY = "edutrack-session";

const store = {
  async get(k: string) {
    if (Platform.OS === "web") return AsyncStorage.getItem(k);
    return SecureStore.getItemAsync(k);
  },
  async set(k: string, v: string) {
    if (Platform.OS === "web") return AsyncStorage.setItem(k, v);
    return SecureStore.setItemAsync(k, v);
  },
  async del(k: string) {
    if (Platform.OS === "web") return AsyncStorage.removeItem(k);
    return SecureStore.deleteItemAsync(k);
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await store.get(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setStudent(parsed.student);
          setSchool(parsed.school);
        }
      } catch (e) {
        console.warn("auth restore", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function setSession(s: Student, sc: School) {
    setStudent(s);
    setSchool(sc);
    await store.set(KEY, JSON.stringify({ student: s, school: sc }));
  }

  async function signOut() {
    setStudent(null);
    setSchool(null);
    await store.del(KEY);
  }

  return (
    <Ctx.Provider value={{ student, school, loading, setSession, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}
