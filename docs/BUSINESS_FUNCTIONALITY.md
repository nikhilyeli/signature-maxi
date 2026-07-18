# Business Functionality Guide

This document explains the core business logic of the Signature Maxi application, designed for Business Writers and Product Managers to understand how data flows and how compliance/accountability is enforced.

## 1. Core Purpose
The application is a drop-in, highly customizable Angular signature capture dialog. It is designed to allow multiple users to sign a document (or "content") either by drawing, typing, or uploading a picture of their signature.

## 2. Accountability & Watermarking
To ensure that a signature cannot be easily forged or detached from its context, the application heavily relies on **Watermarks**.

When a user confirms their signature, the system generates an SVG. The `SignatureMaxiService` instantly stamps this SVG with a non-removable watermark containing:
- **Content ID**: The unique identifier of the document/contract being signed.
- **Signer Name**: The printed name of the person signing.
- **Signer Role**: The legal or business role of the signer (e.g., "Owner", "Witness").
- **Timestamp**: The exact date and time the signature was captured.

*Business Writing Rule*: When explaining the watermark to users, use `/impeccable clarify` to ensure the language is simple. Avoid legal jargon; instead, say "Your signature is securely stamped with the document ID and time for your protection."

## 3. The Three Modalities
The application supports three ways to capture intent, ensuring high conversion rates regardless of the user's device:
1. **Draw Mode**: Uses either a legacy HTML5 Canvas or `@eve-sama/ngx-signature-pad` to capture raw touch/mouse input.
2. **Type Mode**: Allows users to type their name. The app generates an SVG using system-native cursive/serif fonts, eliminating the need to download heavy external fonts.
3. **Capture Mode**: Users can upload a photo of a physical signature. On mobile devices, this seamlessly routes directly to the native OS Camera (iOS/Android) for a frictionless photo-capture experience.

## 4. State Management
Signers are tracked in memory via RxJS `BehaviorSubject`s. 
- Signers can be added, removed, or reset to their default state.
- A user is marked `signed: true` only after a valid SVG payload has been captured and watermarked.
