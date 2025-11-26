"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import Facturapi from "facturapi";

const facturapi = new Facturapi(process.env.FACTURAPI_SECRET_KEY!);

export const downloadFacturapiInvoice = action({
  args: {
    facturapiInvoiceId: v.string(),
    tutor: v.string(),
    paymentType: v.string(),
    createdPayment: v.number()
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
      return {
        success: true,
        pdfData: base64Data,
        filename: `Factura_${args.paymentType.replace(/\s/g, '_')}_${args.tutor.replace(/\s/g, '_')}_${new Date(args.createdPayment).toLocaleDateString()}.pdf`,
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
    const fiscalData = await ctx.runQuery(internal.functions.fiscalData.getFiscalDataByUserIdInternal, {
      userId: args.tutorId,
    });
    if (!fiscalData) {
      return {
        success: false,
        message: "El tutor no tiene información fiscal registrada. Por favor, complete sus datos antes de generar una factura.",
      };
    }

    const payment = await ctx.runQuery(internal.functions.facturapi.getByIdPayments, {
      id: args.paymentId,
    });
    if (!payment) {
      throw new Error("No se encontró el pago en la base de datos.");
    }

    const student = await ctx.runQuery(internal.functions.facturapi.getByIdStudent, {
      id: payment.studentId,
    });
    const billing = await ctx.runQuery(internal.functions.facturapi.getByIdBilling, {
      id: payment.billingId,
    });
    const billingConfig = billing
      ? await ctx.runQuery(internal.functions.facturapi.getByIdBillingConfig, {
        id: billing.billingConfigId,
      })
      : null;

    if (!student || !billing || !billingConfig) {
      throw new Error("Información del pago incompleta: estudiante, billing o billingConfig faltante.");
    }

    const school = await ctx.runQuery(internal.functions.facturapi.getByIdSchool, {
      id: student.schoolId,
    });
    if (!school) {
      throw new Error("Escuela asociada no encontrada.");
    }

    try {
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
        payment_method: "PUE",
        use: fiscalData.cfdiUse,
        currency: "MXN",
        conditions: "Pago en una sola exhibición",
        series: "A",
      });

      return {
        success: true,
        facturapiInvoiceId: invoice.id,
        facturapiInvoiceNumber: String(invoice.folio_number),
        facturapiInvoiceStatus: invoice.status,
      };
    } catch (error: any) {
      console.error("Error al crear factura en Facturapi:");
      console.error("   Error completo:", error);
      throw new Error(
        `Error en Facturapi: ${error.response?.data?.message || error.message || "Error desconocido"}`
      );
    }
  },
});