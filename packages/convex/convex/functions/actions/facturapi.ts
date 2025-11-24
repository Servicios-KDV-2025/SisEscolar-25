"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import Facturapi from "facturapi";
import { getCurrentDateMexico } from "../../utils/dateUtils";

const facturapi = new Facturapi(process.env.FACTURAPI_SECRET_KEY!);


export const createInvoice = action({
  args: {
    paymentId: v.id("payments"),
    billingId: v.id("billing"),
    studentId: v.id("student"),
    schoolId: v.id("school"),
    amount: v.number(),
    paymentType: v.string(),
    studentName: v.string(),
    studentEnrollment: v.string(),
    tutorEmail: v.optional(v.string()),
    tutorName: v.optional(v.string()),
    schoolName: v.string(),
    schoolAddress: v.string(),
    schoolPhone: v.optional(v.string()),
    schoolEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("📄 Creando factura en Facturapi...");

    try {
      // Crear la factura en Facturapi
      const invoice = await facturapi.invoices.create({
        customer: {
          legal_name: args.tutorName || `Tutor de ${args.studentName}`,
          email: args.tutorEmail || undefined,
          tax_id: undefined,
          tax_system: "601",
          address: {
            zip: "00000",
            country: "MEX",
          },
        },
        items: [
          {
            quantity: 1,
            product: {
              description: args.paymentType,
              price: args.amount,
              tax_included: false,
            },
          },
        ],
        payment_form: "01",
        payment_method: "PUE",
        folio_number: undefined,
        series: "A",
        currency: "MXN",
        exchange: 1,
        conditions: "Pago en una sola exhibición",
        organization: {
          legal_name: args.schoolName,
          tax_id: undefined,
          tax_system: "601",
          address: {
            street: args.schoolAddress,
            zip: "00000",
            country: "MEX",
          },
          email: args.schoolEmail,
          phone: args.schoolPhone,
        },
      });

      console.log("✅ Factura creada en Facturapi:", invoice.id);

      // Descargar el PDF de la factura
      const pdfResponse = await facturapi.invoices.downloadPdf(invoice.id);

      let pdfBlob: Blob;
      if (pdfResponse instanceof Blob) {
        pdfBlob = pdfResponse;
      } else {
        // Si es un ReadableStream, convertirlo a Blob
        const reader = (pdfResponse as any).getReader();
        const chunks: Uint8Array[] = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }

        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const uint8Array = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          uint8Array.set(chunk, offset);
          offset += chunk.length;
        }

        pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
      }

      console.log("✅ Factura creada exitosamente en Facturapi");

      // Actualizar el pago con la información de Facturapi
      await (ctx as any).db.patch(args.paymentId, {
        facturapiInvoiceId: invoice.id,
        facturapiInvoiceNumber: invoice.folio_number,
        facturapiInvoiceStatus: invoice.status,
        updatedAt: Date.now(),
      });

      return {
        success: true,
        facturapiInvoiceId: invoice.id,
        invoiceNumber: String(invoice.folio_number),
        status: invoice.status,
      };
    } catch (error) {
      console.error("❌ Error creando factura en Facturapi:", error);
      throw new Error(`Error creando factura: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Action para descargar PDF de factura desde Facturapi
export const downloadFacturapiInvoice = action({
  args: {
    facturapiInvoiceId: v.string(),
    student: v.string(),
    paymentType: v.string()
  },
  handler: async (ctx, args) => {

    try {
      const pdfBuffer = await facturapi.invoices.downloadPdf(args.facturapiInvoiceId);

      let base64Data: string;

      try {
        if (pdfBuffer instanceof Blob) {
          const arrayBuffer = await pdfBuffer.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          base64Data = Buffer.from(uint8Array).toString('base64');
        } else if (Buffer.isBuffer(pdfBuffer)) {
          base64Data = pdfBuffer.toString('base64');
        } else if (typeof pdfBuffer === 'string') {
          base64Data = pdfBuffer;
        } else if (pdfBuffer && typeof (pdfBuffer as any).read === 'function') {
          const chunks: Buffer[] = [];

          await new Promise<void>((resolve, reject) => {
            (pdfBuffer as any).on('data', (chunk: Buffer) => {
              chunks.push(chunk);
            });

            (pdfBuffer as any).on('end', () => {
              resolve();
            });

            (pdfBuffer as any).on('error', (error: Error) => {
              reject(error);
            });
          });

          const buffer = Buffer.concat(chunks);
          base64Data = buffer.toString('base64');
        } else {
          base64Data = Buffer.from(pdfBuffer as any).toString('base64');
        }
      } catch (conversionError) {
        console.error("Error convirtiendo PDF a base64:", conversionError);
        throw new Error("Error procesando el archivo PDF");
      }
      const date = getCurrentDateMexico();
      return {
        success: true,
        pdfData: base64Data,
        filename: `Factura_${args.student.replace(/\s/g, '_')}_${args.paymentType}_${date.getDate()}.pdf`,
      };
    } catch (error: any) {
      console.error("Error descargando PDF de Facturapi:", error.response?.data || error);
      throw new Error(
        `Error descargando PDF: ${error.response?.data?.message || error.message || "Error desconocido"}`
      );
    }
  },
});

export const generateFacturapiInvoice = action({
  args: {
    paymentId: v.id("payments"),
    tutorId: v.id("user"),
  },
  handler: async (ctx, args) => {
    console.log("📄 Iniciando generación manual de factura...");


    const payment = await ctx.runQuery(internal.functions.facturapiQueries.getByIdPayments, {
      id: args.paymentId,
    });
    if (!payment) {
      throw new Error("❌ No se encontró el pago en la base de datos.");
    }

    const fiscalData = await ctx.runQuery(internal.functions.fiscalData.getFiscalDataByUserIdInternal, {
      userId: args.tutorId,
    });
    if (!fiscalData) {
      throw new Error("❌ El tutor no tiene información fiscal registrada. Por favor, complete sus datos antes de generar una factura.");
    }

    console.log("📄 Datos fiscales del tutor:", fiscalData.taxId, fiscalData.legalName);
    const student = await ctx.runQuery(internal.functions.facturapiQueries.getByIdStudent, {
      id: payment.studentId,
    });
    const billing = await ctx.runQuery(internal.functions.facturapiQueries.getByIdBilling, {
      id: payment.billingId,
    });
    const billingConfig = billing
      ? await ctx.runQuery(internal.functions.facturapiQueries.getByIdBillingConfig, {
        id: billing.billingConfigId,
      })
      : null;

    if (!student || !billing || !billingConfig) {
      throw new Error("❌ Información del pago incompleta: estudiante, billing o billingConfig faltante.");
    }

    const school = await ctx.runQuery(internal.functions.facturapiQueries.getByIdSchool, {
      id: student.schoolId,
    });
    if (!school) {
      throw new Error("❌ Escuela asociada no encontrada.");
    }

    console.log("🏫 Escuela encontrada:", school.name);

    try {
      console.log("📄 Creando factura en Facturapi con datos:");
      console.log("   Customer:", fiscalData.legalName, fiscalData.taxId);
      console.log("   Amount:", payment.amount);
      console.log("   Payment method:", payment.method);

      const invoice = await facturapi.invoices.create({
        customer: {
          legal_name: fiscalData.legalName,
          email: fiscalData.email,
          tax_id: fiscalData.taxId,
          tax_system: fiscalData.taxSystem,
          address: {
            street: fiscalData.street,
            neighborhood: fiscalData.neighborhood,
            zip: fiscalData.zip,
            city: fiscalData.city,
            state: fiscalData.state,
            country: "MEX",
          },
        },
        items: [
          {
            quantity: 1,
            product: {
              description: billingConfig.type,
              product_key: "86121500",
              price: payment.amount,
              tax_included: true,
            },
          },
        ],
        payment_form: payment.method === "card" ? "04" :
          payment.method === "bank_transfer" ? "03" : "99",
        payment_method: "PUE", // Pago en una sola exhibición
        use: fiscalData.cfdiUse,
        currency: "MXN",
        conditions: "Pago en una sola exhibición",
        series: "A", // Serie opcional
      });

      console.log("✅ Factura creada exitosamente en Facturapi:");
      console.log("   ID:", invoice.id);
      console.log("   Folio:", invoice.folio_number);
      console.log("   Estado:", invoice.status);

      // Descargar PDF y XML
      console.log("📄 Descargando archivos de Facturapi...");
      const pdfBuffer = await facturapi.invoices.downloadPdf(invoice.id);
      const xmlBuffer = await facturapi.invoices.downloadXml(invoice.id);
      console.log("✅ Archivos descargados correctamente");

      return {
        success: true,
        facturapiInvoiceId: invoice.id,
        invoiceNumber: invoice.folio_number ?? "",
        status: invoice.status,
      };
    } catch (error: any) {
      console.error("❌ Error al crear factura en Facturapi:");
      console.error("   Error completo:", error);
      console.error("   Response data:", error.response?.data);
      console.error("   Status:", error.response?.status);

      throw new Error(
        `Error en Facturapi: ${error.response?.data?.message || error.message || "Error desconocido"}`
      );
    }
  },
});