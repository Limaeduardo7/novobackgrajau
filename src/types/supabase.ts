/**
 * Tipagem para o banco de dados do Supabase
 * Baseado no schema Prisma:
 * 
 * model BlogPost {
 *   id          String    @id @default(uuid())
 *   title       String
 *   slug        String    @unique
 *   content     String?
 *   image       String?
 *   published   Boolean   @default(false)
 *   publishedAt DateTime?
 *   featured    Boolean   @default(false)
 *   authorId    String?
 *   categoryId  String?
 *   tags        String[]
 *   createdAt   DateTime  @default(now())
 *   updatedAt   DateTime  @updatedAt
 *   category    Category? @relation(fields: [categoryId], references: [id])
 * 
 *   @@map("BlogPost")
 * }
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      BlogPost: {
        Row: {
          id: string
          title: string
          slug: string
          content: string | null
          image: string | null
          published: boolean
          publishedAt: string | null
          featured: boolean
          authorId: string | null
          categoryId: string | null
          tags: string[]
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content?: string | null
          image?: string | null
          published?: boolean
          publishedAt?: string | null
          featured?: boolean
          authorId?: string | null
          categoryId?: string | null
          tags?: string[]
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string | null
          image?: string | null
          published?: boolean
          publishedAt?: string | null
          featured?: boolean
          authorId?: string | null
          categoryId?: string | null
          tags?: string[]
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "BlogPost_categoryId_fkey"
            columns: ["categoryId"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 