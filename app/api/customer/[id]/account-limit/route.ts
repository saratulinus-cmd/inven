import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountLimit } = await request.json()
    const customerId = params.id

    if (typeof accountLimit !== 'number' || accountLimit < 0) {
      return NextResponse.json(
        { error: 'Invalid account limit value' },
        { status: 400 }
      )
    }

    // Update the customer's account limit
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { accountLimit: accountLimit },
    })

    return NextResponse.json({
      success: true,
      accountLimit: updatedCustomer.accountLimit,
      message: 'Account limit updated successfully'
    })

  } catch (error) {
    console.error('Error updating account limit:', error)
    return NextResponse.json(
      { error: 'Failed to update account limit' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerId = params.id

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { accountLimit: true },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      accountLimit: customer.accountLimit || 0
    })

  } catch (error) {
    console.error('Error fetching account limit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account limit' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}