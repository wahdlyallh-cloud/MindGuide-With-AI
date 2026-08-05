// Helper utility for WebAuthn Biometric registration & verification (Fingerprint / Face ID)

export async function isBiometricsSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch {
    return false;
  }
}

// Convert ArrayBuffer to Base64url
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Convert Base64url to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  let padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Register device biometrics (Fingerprint / Face ID) via WebAuthn
 */
export async function registerBiometrics(): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'ميزّة البصمة غيّر مدعومة في هذا المتصفح/الجهاز.' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

    // Request OS Biometric enrollment
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'تطبيق يومياتي AI Pro',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: 'user@yawmiyati.app',
          displayName: 'مستخدم يومياتي'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Hardware sensor (Fingerprint / Face ID / Touch ID)
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000
      }
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'تم إغلاق أو إلغاء عملية تسجيل البصمة.' };
    }

    const credIdBase64 = bufferToBase64(credential.rawId);
    return { success: true, credentialId: credIdBase64 };
  } catch (err: any) {
    console.error('WebAuthn register error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'تم إلغاء عملية البصمة أو فشل التحقق من هوية الوجه/الإصبع.' };
    }
    if (err.name === 'InvalidStateError') {
      return { success: false, error: 'البصمة مسجلة بالفعل لهذا الجهاز.' };
    }
    return { success: false, error: err.message || 'فشل الاتصال بمستشعر البصمة في الجهاز.' };
  }
}

/**
 * Verify registered device biometrics (Fingerprint / Face ID)
 */
export async function verifyBiometrics(credentialId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'البصمة غير مدعومة على هذا الجهاز.' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required'
    };

    // If we have a saved credential ID, bind strictly to it
    if (credentialId) {
      publicKeyOptions.allowCredentials = [
        {
          id: base64ToBuffer(credentialId),
          type: 'public-key'
        }
      ];
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions
    });

    if (assertion) {
      return { success: true };
    } else {
      return { success: false, error: 'لم يتم إرجاع أي تأكيد للبصمة.' };
    }
  } catch (err: any) {
    console.error('WebAuthn verify error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'تم إلغاء طلب البصمة أو لم تتعرف الكاميرا/الحساس على الوجه/الإصبع.' };
    }
    return { success: false, error: err.message || 'فشلت عملية التحقق الأمني من البصمة.' };
  }
}
