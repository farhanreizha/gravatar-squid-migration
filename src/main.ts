import { TypeormDatabase } from "@subsquid/typeorm-store";
import { Gravatar } from "./model";
import { processor } from "./processor";
import { events } from "./abi/Gravity";
import { decodeHex } from "@subsquid/evm-processor";

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  const gravatars: Map<string, Gravatar> = new Map();
  for (let c of ctx.blocks) {
    for (let log of c.logs) {
      const { id, owner, displayName, imageUrl } = extractData(log);
      let idString = `0x${id.toString(16)}`;
      gravatars.set(
        idString,
        new Gravatar({
          id: idString,
          owner: decodeHex(owner),
          displayName,
          imageUrl,
        })
      );
    }
  }
  // upsert batches of entities with batch-optimized ctx.store.save
  await ctx.store.upsert([...gravatars.values()]);
});

function extractData(evmLog: any): {
  id: bigint;
  owner: string;
  displayName: string;
  imageUrl: string;
} {
  if (evmLog.topics[0] === events.NewGravatar.topic) {
    return events.NewGravatar.decode(evmLog);
  }
  if (evmLog.topics[0] === events.UpdatedGravatar.topic) {
    return events.UpdatedGravatar.decode(evmLog);
  }
  throw new Error("Unsupported topic");
}

// function extractData(log: any): {
//   idString: string;
//   owner: string;
//   displayName: string;
//   imageUrl: string;
// } {
//   if (log.topics[0] === GravatarABI.events.NewGravatar.topic) {
//     const { id, owner, displayName, imageUrl } =
//       GravatarABI.events.NewGravatar.decode(log);

//     const gravatar = new Gravatar({
//       id: id,
//       owner,
//       displayName,
//       imageUrl,
//     });
//   }
//   if (log.topics[0] === GravatarABI.events.UpdatedGravatar.topic) {
//     const { id, owner, displayName, imageUrl } =
//       GravatarABI.events.UpdatedGravatar.decode(log);
//   }
//   throw new Error("Unsupported topic");
// }
