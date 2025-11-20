import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { description, imageUrl } = await request.json();
    
    if (!description || !imageUrl) {
      return NextResponse.json(
        { error: 'Description and imageUrl are required' },
        { status: 400 }
      );
    }
    
    const post = await prisma.post.create({
      data: {
        description,
        imageUrl,
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, description } = await request.json();
    
    if (!id || !description) {
      return NextResponse.json(
        { error: 'Post ID and description are required' },
        { status: 400 }
      );
    }
    
    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { description },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // First get the post to get the image URL
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Delete the post
    await prisma.post.delete({
      where: { id: Number(id) },
    });

    // Return the deleted post data which includes the imageUrl
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}