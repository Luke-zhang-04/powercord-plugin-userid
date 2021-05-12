const {Plugin} = require("powercord/entities")
const webpack = require("powercord/webpack")

/**
 * Calculates elapsed time between current and previous
 * @param {number} current - current time
 * @param {number} previous - previous time
 * @returns time difference
 */
const timeDifference = (current, previous) => {
    const msPerMinute = 60 * 1000
    const msPerHour = msPerMinute * 60
    const msPerDay = msPerHour * 24
    const msPerMonth = msPerDay * 30
    const msPerYear = msPerDay * 365
    const elapsed = current - previous

    if (elapsed < msPerMinute) {
        return `${Math.round(elapsed / 1000)} seconds ago`
    } else if (elapsed < msPerHour) {
        return `${Math.round(elapsed / msPerMinute)} minutes ago`
    } else if (elapsed < msPerDay) {
        return `${Math.round(elapsed / msPerHour)} hours ago`
    } else if (elapsed < msPerMonth) {
        return `approximately ${Math.round(elapsed / msPerDay)} days ago`
    } else if (elapsed < msPerYear) {
        return `approximately ${Math.round(elapsed / msPerMonth)} months ago`
    }

    return `approximately ${Math.round(elapsed / msPerYear)} years ago`
}

/**
 * Formats user result into a string for Discord
 * @param {string} id - userid
 * @param {string} username - username
 * @param {string} tag - user tag
 * @param {boolean} isBot - if user is a bot
 * @param {string} avatarURL - avatar image URL
 * @param {string} humanTime - creation date
 * @param {string} relativeTime - elapsed time from creation
 * @param {"default" | "md" | "json" | "yaml"} format - output format
 * @returns {string} formatted result
 */
const formatResult = (
    id,
    username,
    tag,
    isBot,
    avatarURL,
    humanTime,
    relativeTime,
    format = "default",
) => {
    if (format === "md") {
        return `\`\`\`md
# UserID Lookup for ${username}

## ID
${id}

## Tag
${tag}

## Username
${username}

## Is Bot
${isBot}

## Avatar
${avatarURL.replace(/(^<)|(>$)/gi, "")}

## Created
${humanTime} (${relativeTime})
\`\`\``
    } else if (format === "json") {
        return `\`\`\`json
{
    "id": "${id}",
    "tag": "${tag}",
    "username": "${username}",
    "isBot": ${isBot},
    "avatarURL": "${avatarURL.replace(/(^<)|(>$)/gi, "")}",
    "created": "${humanTime} (${relativeTime})"
}
\`\`\``
    } else if (format === "yaml") {
        return `\`\`\`yaml
id: "${id}"
tag: ${tag}
username: ${username}
isBot: ${isBot}
avatarURL: ${avatarURL.replace(/(^<)|(>$)/gi, "")}
created: ${humanTime} (${relativeTime})
\`\`\``
    }

    return `**UserID Lookup for ${username}**

_ID_: ${id}
_Tag_: ${tag}
_Username_: ${username}
_Is Bot_: ${isBot}
_Avatar_: ${avatarURL}
_Created_: ${humanTime} (${relativeTime})
`
}

module.exports = class UserIDInfo extends Plugin {
    startPlugin() {
        powercord.api.commands.registerCommand({
            command: "userid",
            aliases: ["useridinfo", "idinfo"],
            label: "UserID Info",
            usage: "{c} <id> [--send] [--no-tag] [--show-avatar] [--format=[default, md, json, yaml]]",
            description: "Lookup user info from a user id",
            executor: (args) => this.getInfo(args),
        })
    }

    /**
     * Gets the user info of a user and returns an object for the powercord API
     * @param {string[]} args - args
     * @returns powercord API object
     */
    async getInfo(args) {
        const shouldSend = args.includes("--send")
        const shouldTag = !args.includes("--no-tag")
        const shouldShowAvatar = args.includes("--show-avatar")
        const format = args.join(" ").match(/--format=(?<format>[A-z]+)/i)?.groups?.format
        const id = shouldSend ? args.find((arg) => !arg.startsWith("-")) : args[0]

        if (!id) {
            return {
                result: "Missing argument id",
                send: false,
            }
        }

        try {
            const userObject = await (
                await webpack.getModule(["acceptAgreements", "getUser"])
            ).getUser(id)
            const username = `${userObject.username}#${userObject.discriminator}`
            /** @type {string} */
            const avatarURL = (
                userObject.avatarURL.includes("assets")
                    ? `https://canary.discord.com${userObject.avatarURL}`
                    : userObject.avatarURL
            ).replace(/\?size=[0-9]+$/i, "")
            const isBot = String(userObject.bot)
            const unixTime = id / 4_194_304 + 1_420_070_400_000
            const jsTime = new Date(unixTime)
            const humanTime = `${
                jsTime.getMonth() + 1
            }/${jsTime.getDate()}/${jsTime.getFullYear()}`
            const currentTime = Date.now()
            const relativeTime = timeDifference(currentTime, unixTime)

            const result = shouldSend
                ? formatResult(
                      id,
                      username,
                      shouldTag ? `<@${id}>` : `@${id}`,
                      isBot,
                      shouldShowAvatar ? avatarURL : `<${avatarURL}>`,
                      humanTime,
                      relativeTime,
                      format,
                  )
                : {
                      type: "rich",
                      title: `UserID Lookup for ${username}`,
                      fields: [
                          {
                              name: "ID",
                              value: `${id}`,
                              inline: false,
                          },
                          {
                              name: "Tag",
                              value: `<@${id}>`,
                              inline: false,
                          },
                          {
                              name: "Username",
                              value: username,
                              inline: false,
                          },
                          {
                              name: "Is Bot",
                              value: `${isBot}`,
                              inline: false,
                          },
                          {
                              name: "Avatar",
                              value: avatarURL,
                              inline: false,
                          },
                          {
                              name: "Created",
                              value: humanTime + " (" + relativeTime + ")",
                              inline: false,
                          },
                      ],
                  }

            return {
                result,
                embed: !shouldSend,
                send: shouldSend,
            }
        } catch (err) {
            return {
                result:
                    err instanceof Error || typeof err.toString === "function"
                        ? err.toString()
                        : JSON.stringify(err),
                send: false,
            }
        }
    }

    pluginWillUnload() {
        powercord.api.commands.unregisterCommand("userid")
    }
}
