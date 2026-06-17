export type TransactionType = 'CASH_IN' | 'CASH_OUT'

export type TransactionStatus = 'approved' | 'pending' | 'flagged'

export type Transaction = {
  id: string
  entity: string
  date: string
  time: string
  category: string
  categoryStyle: 'secondary' | 'tertiary' | 'primary'
  amount: number
  currency: string
  status: TransactionStatus
  book: string
  balance: number
  avatar?: { initials: string; color: string }
  invoice?: string
  method?: string
  description?: string | null
  comments?: Comment[]
  attachments?: Attachment[]
}

export type Comment = {
  id: string
  author: string
  initials: string
  avatarColor: string
  timeAgo: string
  message: string
  highlight?: string
  isHighlighted?: boolean
}

export type Attachment = {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedById?: string
  createdAt?: string
}


