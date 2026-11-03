// Server-owned storage selection; never accepts a path from browser requests.
import {resolveEvidenceHome,prepareEvidenceHome} from './evidence-home.mjs';
import {createEvidenceStore} from './evidence-store.mjs';
import {createEvidencePackageStore} from './evidence-package.mjs';

export async function createWorkspaceEvidenceStores({environment=process.env,evidenceHome,metadata={}}={}){
 const storage=await prepareEvidenceHome({evidenceHome:evidenceHome===undefined?resolveEvidenceHome({environment}):evidenceHome});
 const evidenceStore=await createEvidenceStore({directory:storage.runsDirectory,metadata,assertCurrent:storage.assertCurrent});
 let evidencePackageStore=null;
 try{evidencePackageStore=await createEvidencePackageStore({evidenceHome:storage.home});}catch{/* Export availability is reported independently of coding. */}
 return{home:storage.home,evidenceStore,evidencePackageStore};
}
