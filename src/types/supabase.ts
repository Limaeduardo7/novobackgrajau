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
      empresas: {
        Row: {
          id: number
          name: string
          slug?: string | null
          category: string
          description: string | null
          image: string | null
          address: string | null
          phone: string | null
          state: string
          city: string
          email: string | null
          website: string | null
          social_media: Json | null
          opening_hours: Json | null
          is_featured: boolean
          rating: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug?: string | null
          category: string
          description?: string | null
          image?: string | null
          address?: string | null
          phone?: string | null
          state: string
          city: string
          email?: string | null
          website?: string | null
          social_media?: Json | null
          opening_hours?: Json | null
          is_featured?: boolean
          rating?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string | null
          category?: string
          description?: string | null
          image?: string | null
          address?: string | null
          phone?: string | null
          state?: string
          city?: string
          email?: string | null
          website?: string | null
          social_media?: Json | null
          opening_hours?: Json | null
          is_featured?: boolean
          rating?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          ocupacao: string
          especialidades: string[]
          experiencia: string
          educacao: string[]
          certificacoes: string[] | null
          portfolio: string[] | null
          disponibilidade: string
          valor_hora: number | null
          sobre: string
          foto: string | null
          telefone: string
          email: string
          website: string | null
          endereco: string | null
          cidade: string
          estado: string
          social_media: Json | null
          status: string
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nome: string
          ocupacao: string
          especialidades: string[]
          experiencia: string
          educacao: string[]
          certificacoes?: string[] | null
          portfolio?: string[] | null
          disponibilidade: string
          valor_hora?: number | null
          sobre: string
          foto?: string | null
          telefone: string
          email: string
          website?: string | null
          endereco?: string | null
          cidade: string
          estado: string
          social_media?: Json | null
          status?: string
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          nome?: string
          ocupacao?: string
          especialidades?: string[]
          experiencia?: string
          educacao?: string[]
          certificacoes?: string[] | null
          portfolio?: string[] | null
          disponibilidade?: string
          valor_hora?: number | null
          sobre?: string
          foto?: string | null
          telefone?: string
          email?: string
          website?: string | null
          endereco?: string | null
          cidade?: string
          estado?: string
          social_media?: Json | null
          status?: string
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          requirements: string[]
          benefits: string[]
          salary: string
          type: string
          location: string
          status: string
          featured: boolean
          business_id: string
          createdAt: string
          updatedAt: string
          expiresAt: string | null
          views: number
          applications: number
          tags: string[]
        }
        Insert: {
          id?: string
          title: string
          description: string
          requirements?: string[]
          benefits?: string[]
          salary: string
          type: string
          location: string
          status?: string
          featured?: boolean
          business_id: string
          createdAt?: string
          updatedAt?: string
          expiresAt?: string | null
          views?: number
          applications?: number
          tags?: string[]
        }
        Update: {
          id?: string
          title?: string
          description?: string
          requirements?: string[]
          benefits?: string[]
          salary?: string
          type?: string
          location?: string
          status?: string
          featured?: boolean
          business_id?: string
          createdAt?: string
          updatedAt?: string
          expiresAt?: string | null
          views?: number
          applications?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_businessId_fkey"
            columns: ["business_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          }
        ]
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