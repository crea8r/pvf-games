/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tetris_streaming.json`.
 */
export type TetrisStreaming = {
  "address": "4axrKjG14aHD1MZEQUKZdCmptv3xiojyCpEm4PHbSLUZ",
  "metadata": {
    "name": "tetrisStreaming",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "choosePiece",
      "discriminator": [
        30,
        228,
        132,
        255,
        245,
        54,
        193,
        148
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "room",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  109
                ]
              },
              {
                "kind": "arg",
                "path": "roomId"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "streamer",
          "writable": true
        },
        {
          "name": "devWallet",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roomId",
          "type": "u8"
        },
        {
          "name": "pieceType",
          "type": "u8"
        }
      ]
    },
    {
      "name": "claimRoom",
      "discriminator": [
        62,
        51,
        97,
        121,
        144,
        160,
        43,
        85
      ],
      "accounts": [
        {
          "name": "room",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  109
                ]
              },
              {
                "kind": "arg",
                "path": "roomId"
              }
            ]
          }
        },
        {
          "name": "streamer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roomId",
          "type": "u8"
        },
        {
          "name": "roomName",
          "type": "string"
        },
        {
          "name": "streamUrl",
          "type": "string"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "devWallet",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "room",
      "discriminator": [
        156,
        199,
        67,
        27,
        222,
        23,
        185,
        94
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidRoomId",
      "msg": "Invalid room ID. Must be 0-9."
    },
    {
      "code": 6001,
      "name": "roomNameTooLong",
      "msg": "Room name too long. Max 50 characters."
    },
    {
      "code": 6002,
      "name": "streamUrlTooLong",
      "msg": "Stream URL too long. Max 200 characters."
    },
    {
      "code": 6003,
      "name": "invalidPieceType",
      "msg": "Invalid piece type. Must be 0-6."
    },
    {
      "code": 6004,
      "name": "invalidStreamer",
      "msg": "Only the room owner can receive payments."
    },
    {
      "code": 6005,
      "name": "invalidDevWallet",
      "msg": "Invalid dev wallet."
    },
    {
      "code": 6006,
      "name": "roomNotExpired",
      "msg": "Room is not expired yet. Wait 2 minutes before reclaiming."
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "devWallet",
            "type": "pubkey"
          },
          {
            "name": "piecePrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "room",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roomName",
            "type": "string"
          },
          {
            "name": "streamUrl",
            "type": "string"
          },
          {
            "name": "playerWallet",
            "type": "pubkey"
          },
          {
            "name": "latestChosenPiece",
            "type": "u8"
          },
          {
            "name": "lastBuyer",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
