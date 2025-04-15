export interface Vec2 { x: number; y: number; }


export interface Vec3 { x: number; y: number; z: number; }


export type Json = string | number | boolean | null | Json[] | { [key: string]: Json; };
