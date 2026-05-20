import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const postId = params.id

    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        likesCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ success: true, likesCount: updated.likesCount })
  } catch (error) {
    console.error('Post LIKE Error:', error)
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }
}
