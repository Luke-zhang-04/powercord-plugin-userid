export type User = {
    avatar: string
    bot: boolean
    discriminator: string
    email: string | null
    flags: number
    id: string
    mfaEnabled: boolean
    mobile: false
    nsfwAllowed?: boolean
    phone: string | null
    premiumType?: number
    publicFlags: number
    purchasedFlags: number
    system: boolean
    username: string
    usernameNormalized: string
    verified: boolean
    avatarURL: string
    createdAt: Date
    hasPremiumPerks: boolean
    tag: string
}
