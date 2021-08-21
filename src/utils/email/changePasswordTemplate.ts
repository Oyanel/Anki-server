export const changePasswordTemplate = (email: string, otpCode: number) => {
    return `<p>Hello,</p>
        <p>A change password request as been made for ${email}.</p>
        <p>Please use the verification code below on the Ryoumengo app.</p>
        <p><b>${otpCode}</b></p>
        <p>If you didn't request this, you can ignore this email.</p>`.trim();
};
