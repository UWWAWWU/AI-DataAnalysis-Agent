'use client';
import {createContext,useContext,useState,type ReactNode,type Dispatch,type SetStateAction} from 'react';
export type VisualState=Record<string,Record<string,unknown>>;
const Context=createContext<{values:VisualState;setValues:Dispatch<SetStateAction<VisualState>>}|null>(null);
export function useChartColors(){const context=useContext(Context);return {categories:context?.values.colors||{},accents:context?.values.accents||{}};}
export function VisualStateProvider({values,setValues,children}:{values:VisualState;setValues:Dispatch<SetStateAction<VisualState>>;children:ReactNode}){return <Context.Provider value={{values,setValues}}>{children}</Context.Provider>}
export function useVisualState<T extends Record<string,unknown>>(key:string,defaults:T):[T,Dispatch<SetStateAction<T>>]{
 const context=useContext(Context);
 const local=useState<T>(defaults);if(!context)return local;
 const state={...defaults,...context.values[key]} as T;
 const setState:Dispatch<SetStateAction<T>>=next=>context.setValues(current=>{const previous={...defaults,...current[key]} as T;return {...current,[key]:typeof next==='function'?next(previous):next}});
 return [state,setState];
}
